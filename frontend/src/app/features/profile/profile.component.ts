import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService, UserProfile } from '../../core/services/user.service';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { ReportModalComponent } from '../../core/components/report-modal/report-modal.component';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';
import { AdminService } from '../../core/services/admin.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, ReportModalComponent, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private adminService = inject(AdminService);
  private confirmationService = inject(ConfirmationService);

  userProfile: UserProfile | null = null;
  username: string = '';
  posts: Post[] = [];
  isLoadingMore = false;
  hasMorePosts = true;
  profileUsername = '';
  currentUser = this.getCurrentUsername();

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username') || '';
      this.loadUserProfile();
      this.loadUserPosts();
    });
  }

  showReportModal = false;
  showEditModal = false;
  editBio: string = '';
  selectedAvatar: File | null = null;
  avatarPreview: string | null = null;
  isSaving: boolean = false;

  openReportModal() { this.showReportModal = true; }
  closeReportModal() { this.showReportModal = false; }

  loadUserProfile() {
    this.userService.getUserProfile(this.username).subscribe({
      next: (profile) => this.userProfile = profile,
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  openEditModal() {
    this.editBio = this.userProfile?.bio || '';
    this.avatarPreview = this.userProfile?.profilePictureUrl
      ? `http://localhost:8080/uploads/${this.userProfile.profilePictureUrl}`
      : null;
    this.selectedAvatar = null;
    this.showEditModal = true;
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAvatar = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.avatarPreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    this.isSaving = true;
    this.userService.updateProfile(this.editBio, this.selectedAvatar).subscribe({
      next: (updatedUser) => {
        if (this.userProfile) {
          this.userProfile.bio = updatedUser.bio;
          if (updatedUser.profilePictureUrl) {
            this.userProfile.profilePictureUrl = updatedUser.profilePictureUrl;
          }
        }
        this.isSaving = false;
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.isSaving = false;
      }
    });
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editBio = '';
    this.selectedAvatar = null;
    this.avatarPreview = null;
  }

  onPostDeleted(deletedPostId: number) {
    this.posts = this.posts.filter(p => p.id !== deletedPostId);
  }

  loadUserPosts() {
    if (this.isLoadingMore || !this.hasMorePosts) return;
    this.isLoadingMore = true;

    let lastId = null;
    if (this.posts.length > 0) {
      lastId = this.posts[this.posts.length - 1].id;
    }

    this.postService.getUserPosts(this.username, lastId).subscribe({
      next: (newPosts) => {
        this.posts = [...this.posts, ...newPosts];
        this.hasMorePosts = newPosts.length === 10;
        this.isLoadingMore = false;
      },
      error: () => this.isLoadingMore = false
    });
  }

  toggleFollow() {
    if (!this.userProfile) return;

    if (this.userProfile.isFollowing) {
      this.userProfile.isFollowing = false;
      this.userProfile.followersCount--;

      this.userService.unfollowUser(this.userProfile.username).subscribe({
        error: (err) => {
          console.error('Failed to unfollow', err);
          this.userProfile!.isFollowing = true;
          this.userProfile!.followersCount++;
        }
      });
    } else {
      this.userProfile.isFollowing = true;
      this.userProfile.followersCount++;

      this.userService.followUser(this.userProfile.username).subscribe({
        error: (err) => {
          console.error('Failed to follow', err);
          this.userProfile!.isFollowing = false;
          this.userProfile!.followersCount--;
        }
      });
    }
  }

  getCurrentUsername(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch (e) {
      return '';
    }
  }

  isAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return JSON.stringify(payload.roles).includes('ROLE_ADMIN');
    } catch (e) {
      return false;
    }
  }

  toggleBanAsAdmin() {
    if (!this.userProfile) return;

    const isCurrentlyBanned = this.userProfile.isBanned !== undefined ? this.userProfile.isBanned : false;
    const action = isCurrentlyBanned ? 'UNBAN' : 'BAN';

    this.confirmationService.requireConfirmation({
      title: `${action === 'BAN' ? 'Ban' : 'Unban'} User`,
      message: `Are you sure you want to ${action.toLowerCase()} @${this.userProfile.username}? They will ${action === 'BAN' ? 'lose' : 'regain'} access to their account.`,
      confirmText: `Yes, ${action}`,
      isDanger: action === 'BAN',
      action: () => {
        this.adminService.toggleBanUser(this.userProfile!.id).subscribe({
          next: () => {
            if (this.userProfile?.isBanned !== undefined) {
              this.userProfile.isBanned = !this.userProfile.isBanned;
            }
          },
          error: (err) => console.error('Failed to toggle ban', err)
        });
      }
    });
  }

  deleteUserAsAdmin() {
    if (!this.userProfile) return;

    this.confirmationService.requireConfirmation({
      title: 'Permanent Deletion',
      message: `CRITICAL OVERRIDE: Are you sure you want to permanently vaporize @${this.userProfile.username}'s account? This action cannot be undone.`,
      confirmText: 'Vaporize Account',
      isDanger: true,
      action: () => {
        this.adminService.deleteUser(this.userProfile!.id).subscribe({
          next: () => {
            this.router.navigate(['/feed']);
          },
          error: (err) => console.error('Failed to delete user', err)
        });
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;
    if (pos >= max - 200) {
      this.loadUserPosts();
    }
  }
}