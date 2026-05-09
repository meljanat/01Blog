import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { RouterModule } from '@angular/router';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { TimeDisplayPipe } from '../../../core/pipes/time-display.pipe';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeDisplayPipe],
  templateUrl: './admin-posts.html',
  styleUrls: ['./admin-posts.scss']
})
export class AdminPostsComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmationService = inject(ConfirmationService);

  posts: any[] = [];
  isLoading: boolean = true;

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.adminService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load posts', err);
        this.isLoading = false;
      }
    });
  }

  deletePostAsAdmin(postId: number) {
    this.confirmationService.requireConfirmation({
      title: 'Delete Post',
      message: 'Are you sure you want to permanently delete this post? This action cannot be undone.',
      confirmText: 'Delete Post',
      isDanger: true,
      action: () => {
        this.adminService.deletePost(postId).subscribe({
          next: () => {
            this.posts = this.posts.filter(p => p.id !== postId);
          },
          error: (err) => console.error('Failed to delete post as admin', err)
        });
      }
    });
  }

  togglePostVisibility(post: any) {
    const hidden = !post.hidden;
    const actionLabel = hidden ? 'Hide Post' : 'Unhide Post';
    const author = post.author?.username ? `@${post.author.username}` : 'this author';

    this.confirmationService.requireConfirmation({
      title: actionLabel,
      message: hidden
        ? `Hide ${author}'s post from feeds and public profile views?`
        : `Make ${author}'s post visible again?`,
      confirmText: actionLabel,
      isDanger: hidden,
      action: () => {
        this.adminService.setPostHidden(post.id, hidden).subscribe({
          next: (updatedPost) => {
            Object.assign(post, updatedPost);
          },
          error: (err) => console.error('Failed to update post visibility', err)
        });
      }
    });
  }
}
