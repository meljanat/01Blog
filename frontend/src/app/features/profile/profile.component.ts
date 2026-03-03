import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService, UserProfile } from '../../core/services/user.service';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { ReportModalComponent } from '../../core/components/report-modal/report-modal.component';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, ReportModalComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private postService = inject(PostService);

  userProfile: UserProfile | null = null;
  username: string = '';
  posts: Post[] = [];
  isLoading: boolean = true;
  currentUser = this.getCurrentUsername();

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username') || '';
      this.loadUserProfile();
      this.loadUserPosts();
    });
  }

  showReportModal = false;

  openReportModal() {
    this.showReportModal = true;
  }
  closeReportModal() {
    this.showReportModal = false;
  }

  loadUserProfile() {
    this.userService.getUserProfile(this.username).subscribe({
      next: (profile) => this.userProfile = profile,
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  onPostDeleted(deletedPostId: number) {
    this.posts = this.posts.filter(p => p.id !== deletedPostId);
  }

  loadUserPosts() {
    this.isLoading = true;
    this.postService.getPostsByUser(this.username).subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load profile posts', err);
        this.isLoading = false;
      }
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
}