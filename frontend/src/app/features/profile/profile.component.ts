import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserRelationship, UserService, UserProfile } from '../../core/services/user.service';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { ReportModalComponent } from '../../core/components/report-modal/report-modal.component';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';
import { AdminService } from '../../core/services/admin.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { FormsModule } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs';
import { TimeDisplayPipe } from '../../core/pipes/time-display.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, ReportModalComponent, FormsModule, TimeDisplayPipe],
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
  currentUser = this.getCurrentUsername();
  private activeProfileLoadId = 0;

  ngOnInit() {
    this.route.paramMap.pipe(
      map(params => params.get('username') || ''),
      distinctUntilChanged()
    ).subscribe(username => this.loadProfile(username));
  }

  showReportModal = false;
  showEditModal = false;
  editBio: string = '';
  selectedAvatar: File | null = null;
  avatarPreview: string | null = null;
  isSaving: boolean = false;
  relationshipModal: 'followers' | 'following' | null = null;
  relationshipUsers: UserRelationship[] = [];
  isLoadingRelationships = false;
  banReason = '';
  banDuration = 'ONE_DAY';
  showBanModal = false;
  banDurations = [
    { value: 'ONE_DAY', label: '1 day' },
    { value: 'THREE_DAYS', label: '3 days' },
    { value: 'ONE_WEEK', label: '1 week' },
    { value: 'PERMANENT', label: 'Permanent' }
  ];

  openReportModal() { this.showReportModal = true; }
  closeReportModal() { this.showReportModal = false; }

  private loadProfile(username: string) {
    this.username = username;
    this.activeProfileLoadId++;

    this.userProfile = null;
    this.posts = [];
    this.hasMorePosts = true;
    this.isLoadingMore = false;
    this.closeReportModal();

    if (!username) return;

    this.loadUserProfile(this.activeProfileLoadId, username);
  }

  loadUserProfile(loadId = this.activeProfileLoadId, username = this.username) {
    this.userService.getUserProfile(username).subscribe({
      next: (profile) => {
        if (loadId !== this.activeProfileLoadId) return;
        this.userProfile = profile;
        if (this.canViewProfilePosts()) {
          this.loadUserPosts(loadId, username);
        } else {
          this.hasMorePosts = false;
          this.isLoadingMore = false;
        }
      },
      error: (err) => {
        if (loadId !== this.activeProfileLoadId) return;
        console.error('Failed to load profile', err);
      }
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

  loadUserPosts(loadId = this.activeProfileLoadId, username = this.username) {
    if (!this.canViewProfilePosts()) return;
    if (this.isLoadingMore || !this.hasMorePosts) return;
    this.isLoadingMore = true;

    let lastId = null;
    if (this.posts.length > 0) {
      lastId = this.posts[this.posts.length - 1].id;
    }

    this.postService.getUserPosts(username, lastId).subscribe({
      next: (newPosts) => {
        if (loadId !== this.activeProfileLoadId) return;
        this.posts = [...this.posts, ...newPosts];
        this.hasMorePosts = newPosts.length === 10;
        this.isLoadingMore = false;
      },
      error: (err) => {
        if (loadId !== this.activeProfileLoadId) return;
        console.error('Failed to load user posts', err);
        this.isLoadingMore = false;
      }
    });
  }

  toggleFollow() {
    if (!this.userProfile || this.isProfileBannedForViewer()) return;

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
    if (!isCurrentlyBanned) {
      this.openBanModal();
      return;
    }

    this.confirmationService.requireConfirmation({
      title: 'Unban User',
      message: `Restore access for @${this.userProfile.username}?`,
      confirmText: 'Unban User',
      isDanger: false,
      action: () => {
        this.adminService.unbanUser(this.userProfile!.id).subscribe({
          next: (updatedUser) => {
            Object.assign(this.userProfile!, updatedUser);
            this.posts = [];
            this.hasMorePosts = true;
            this.loadUserPosts();
          },
          error: (err) => console.error('Failed to unban user', err)
        });
      }
    });
  }

  openBanModal() {
    this.banReason = '';
    this.banDuration = 'ONE_DAY';
    this.showBanModal = true;
  }

  closeBanModal() {
    this.showBanModal = false;
    this.banReason = '';
    this.banDuration = 'ONE_DAY';
  }

  submitBanAsAdmin() {
    if (!this.userProfile || !this.banReason.trim()) return;

    this.adminService.banUser(this.userProfile.id, this.banReason, this.banDuration).subscribe({
      next: (updatedUser) => {
        Object.assign(this.userProfile!, updatedUser);
        this.closeBanModal();
      },
      error: (err) => console.error('Failed to ban user', err)
    });
  }

  openRelationships(type: 'followers' | 'following') {
    if (!this.userProfile || this.isProfileBannedForViewer()) return;

    this.relationshipModal = type;
    this.relationshipUsers = [];
    this.isLoadingRelationships = true;

    const request = type === 'followers'
      ? this.userService.getFollowers(this.userProfile.username)
      : this.userService.getFollowing(this.userProfile.username);

    request.subscribe({
      next: (users) => {
        this.relationshipUsers = users;
        this.isLoadingRelationships = false;
      },
      error: (err) => {
        console.error('Failed to load relationships', err);
        this.isLoadingRelationships = false;
      }
    });
  }

  closeRelationships() {
    this.relationshipModal = null;
    this.relationshipUsers = [];
    this.isLoadingRelationships = false;
  }

  toggleRelationshipFollow(event: Event, user: UserRelationship) {
    event.preventDefault();
    event.stopPropagation();

    if (user.isSelf || user.isBanned) return;

    const previousState = user.isFollowing;
    user.isFollowing = !user.isFollowing;

    const request = previousState
      ? this.userService.unfollowUser(user.username)
      : this.userService.followUser(user.username);

    request.subscribe({
      error: (err) => {
        console.error('Failed to update relationship', err);
        user.isFollowing = previousState;
      }
    });
  }

  relationshipTitle(): string {
    return this.relationshipModal === 'followers' ? 'Followers' : 'Following';
  }

  isProfileBannedForViewer(): boolean {
    return Boolean(this.userProfile?.isBanned) && !this.isAdmin();
  }

  canViewProfilePosts(): boolean {
    return Boolean(this.userProfile) && (!this.userProfile!.isBanned || this.isAdmin());
  }

  deleteUserAsAdmin() {
    if (!this.userProfile) return;

    this.confirmationService.requireConfirmation({
      title: 'Delete Account',
      message: `Are you sure you want to permanently delete @${this.userProfile.username}'s account? This action cannot be undone.`,
      confirmText: 'Delete Account',
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
