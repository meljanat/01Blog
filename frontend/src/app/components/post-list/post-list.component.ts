import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../services/post.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts: any[] = [];

  // Track which post has comments open
  activeCommentPostId: number | null = null;
  currentComments: any[] = [];
  newCommentText: string = '';

  constructor(private postService: PostService, router: Router) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts() {
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        if (data.error) {
          localStorage.removeItem('auth-token')
        } else this.posts = data;
      },
      error: (err) => {
        console.error('Error fetching posts', err);
      }
    });
  }

  getMediaUrl(url: string): string {
    return `http://localhost:8080${url}`;
  }

  // Toggle the comment section
  toggleComments(postId: number) {
    if (this.activeCommentPostId === postId) {
      this.activeCommentPostId = null;
      this.currentComments = [];
    } else {
      // Open and fetch comments
      this.activeCommentPostId = postId;
      this.newCommentText = ''; // Reset input
      this.postService.getComments(postId).subscribe({
        next: (res) => this.currentComments = res,
        error: (err) => console.error('Error fetching comments', err)
      });
    }
  }

  submitComment(postId: number) {
    if (!this.newCommentText.trim()) return;

    this.postService.addComment(postId, this.newCommentText).subscribe({
      next: (newComment) => {
        // Add the new comment to the top of the list immediately
        this.currentComments.unshift(newComment);
        this.newCommentText = ''; // Clear input
      },
      error: (err) => alert('Failed to post comment')
    });
  }
}