import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-posts.html',
  styleUrls: ['./admin-posts.scss']
})
export class AdminPostsComponent implements OnInit {
  private adminService = inject(AdminService);

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
    if (confirm('ADMIN OVERRIDE: Are you sure you want to permanently delete this post? This cannot be undone.')) {
      this.adminService.deletePost(postId).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== postId);
        },
        error: (err) => console.error('Failed to delete post as admin', err)
      });
    }
  }
}