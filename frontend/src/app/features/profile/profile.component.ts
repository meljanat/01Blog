import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);

  username: string = '';
  posts: Post[] = [];
  isLoading: boolean = true;
  currentUser = this.getCurrentUsername();

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username') || '';
      this.loadUserPosts();
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