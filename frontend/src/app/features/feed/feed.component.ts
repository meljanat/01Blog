import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss']
})
export class FeedComponent implements OnInit {
  private postService = inject(PostService);

  posts: Post[] = [];
  isLoading: boolean = true;
  currentUser = this.getCurrentUsername();

  newPostText: string = '';
  selectedFile: File | null = null;

  ngOnInit() {
    this.loadPosts();
  }

  onPostDeleted(deletedPostId: number) {
    this.posts = this.posts.filter(p => p.id !== deletedPostId);
  }

  loadPosts() {
    this.isLoading = true;
    this.postService.getAllPosts().subscribe({
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  createPost() {
    if (!this.newPostText.trim()) return;

    const formData = new FormData();
    formData.append('text', this.newPostText);
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.postService.createPost(formData).subscribe({
      next: (newPost) => {
        this.posts.unshift(newPost);
        this.newPostText = '';
        this.selectedFile = null;
      },
      error: (err) => console.error('Failed to create post', err)
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