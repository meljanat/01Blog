import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';
import { UserService } from '../../core/services/user.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, PostCardComponent, RouterLink],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss']
})
export class FeedComponent implements OnInit {
  private postService = inject(PostService);
  private userService = inject(UserService);

  posts: Post[] = [];
  currentPage = 0;
  isLoadingMore = false;
  hasMorePosts = true;
  currentUser = this.getCurrentUsername();

  newPostText: string = '';
  selectedFile: File | null = null;

  suggestedUsers: any[] = [];
  isLoadingSuggestions = true;

  ngOnInit() {
    this.loadPosts();
    this.loadSuggestedUsers();
  }

  onPostDeleted(deletedPostId: number) {
    this.posts = this.posts.filter(p => p.id !== deletedPostId);
  }

  loadPosts() {
    if (this.isLoadingMore || !this.hasMorePosts) return;
    this.isLoadingMore = true;

    let lastId = null;
    if (this.posts.length > 0) {
      lastId = this.posts[this.posts.length - 1].id;
    }

    this.postService.getFeed(lastId).subscribe({
      next: (newPosts) => {
        this.posts = [...this.posts, ...newPosts];
        this.hasMorePosts = newPosts.length === 10;
        this.isLoadingMore = false;
      },
      error: (err) => {
        console.error('Failed to load feed', err);
        this.isLoadingMore = false;
      }
    });
  }

  loadSuggestedUsers() {
    this.userService.getSuggestedUsers().subscribe({
      next: (users) => {
        this.suggestedUsers = users;
        this.isLoadingSuggestions = false;
      },
      error: (err) => {
        console.error('Failed to load suggestions', err);
        this.isLoadingSuggestions = false;
      }
    });
  }

  followSuggestedUser(event: Event, user: any) {
    event.preventDefault();
    event.stopPropagation();

    this.userService.followUser(user.username).subscribe({
      next: () => {
        this.suggestedUsers = this.suggestedUsers.filter(u => u.username !== user.username);
      },
      error: (err) => {
        console.error('Failed to follow suggested user', err);
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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;

    if (pos >= max - 200) {
      this.loadPosts();
    }
  }
}