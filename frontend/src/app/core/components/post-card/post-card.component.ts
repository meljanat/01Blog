import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Post, Comment } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { ReportModalComponent } from '../report-modal/report-modal.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ReportModalComponent],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.scss']
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  @Input({ required: true }) currentUser!: string;
  @Input() isDetailView: boolean = false;
  @Output() postDeleted = new EventEmitter<number>();

  private postService = inject(PostService);
  newCommentText: string = '';

  isEditing: boolean = false;
  editPostText: string = '';

  comments: any[] = [];
  isLoadingComments = false;
  hasMoreComments = true;
  commentsVisible = false;
  editingCommentId: number | null = null;
  editCommentText: string = '';

  showReportModal = false;
  reportType: 'POST' = 'POST';
  reportTargetId: number = 0;

  isAdmin: boolean = false;

  ngOnInit() {
    this.checkIfAdmin();
  }

  checkIfAdmin() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.isAdmin = JSON.stringify(payload.roles).includes('ROLE_ADMIN');
      } catch (e) {
        console.error('Error decoding token for admin check', e);
      }
    }
  }

  toggleComments() {
    this.commentsVisible = !this.commentsVisible;
    if (this.commentsVisible && this.comments.length === 0) {
      this.loadMoreComments();
    }
  }

  loadMoreComments() {
    if (this.isLoadingComments || !this.hasMoreComments) return;
    this.isLoadingComments = true;

    let lastId = null;
    if (this.comments.length > 0) {
      lastId = this.comments[this.comments.length - 1].id;
    }

    this.postService.getComments(this.post.id, lastId, 5).subscribe({
      next: (newComments) => {
        this.comments = [...this.comments, ...newComments];
        this.hasMoreComments = newComments.length === 5;
        this.isLoadingComments = false;
      },
      error: () => this.isLoadingComments = false
    });
  }

  isVideo(mediaUrl: string | null): boolean {
    if (!mediaUrl) return false;
    const lowerUrl = mediaUrl.toLowerCase();
    return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.ogg');
  }

  openReportModal(type: 'POST', id: number) {
    this.reportType = type;
    this.reportTargetId = id;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  deletePost() {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      this.postService.deletePost(this.post.id).subscribe({
        next: () => {
          this.postDeleted.emit(this.post.id);
        },
        error: (err) => console.error('Failed to delete post', err)
      });
    }
  }

  startEditing() {
    this.isEditing = true;
    this.editPostText = this.post.text;
  }

  cancelEdit() {
    this.isEditing = false;
    this.editPostText = '';
  }

  saveEdit() {
    if (!this.editPostText.trim() || this.editPostText === this.post.text) {
      this.cancelEdit();
      return;
    }

    this.postService.updatePost(this.post.id, this.editPostText).subscribe({
      next: (updatedPost) => {
        this.post.text = updatedPost.text;
        this.isEditing = false;
      },
      error: (err) => console.error('Failed to update post', err)
    });
  }

  checkIfLiked(): boolean {
    if (!this.post || !this.post.likes || !this.currentUser) {
      return false;
    }

    return this.post.likes.some((user: any) => user.username === this.currentUser);
  }

  toggleLike() {
    const currentlyLiked = this.checkIfLiked();
    if (currentlyLiked) {
      this.post.likes = this.post.likes.filter((user: any) => user.username !== this.currentUser);
    } else {
      this.post.likes.push({ username: this.currentUser });
    }

    this.postService.likePost(this.post.id).subscribe({
      next: (updatedPost) => {
        this.post.likes = updatedPost.likes;
      },
      error: (err) => {
        console.error('Failed to toggle like', err);
        if (currentlyLiked) {
          this.post.likes.push({ username: this.currentUser });
        } else {
          this.post.likes = this.post.likes.filter((user: any) => user.username !== this.currentUser);
        }
      }
    });
  }

  submitComment() {
    if (!this.newCommentText.trim()) return;

    this.postService.addComment(this.post.id, this.newCommentText).subscribe({
      next: (newComment) => {
        if (!this.comments) this.comments = [];
        this.comments.unshift(newComment);

        this.newCommentText = '';
      },
      error: (err) => console.error('Failed to post comment', err)
    });
  }

  deleteComment(commentId: number) {
    if (confirm('Delete this comment?')) {
      this.postService.deleteComment(this.post.id, commentId).subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.id !== commentId);
        },
        error: (err) => console.error('Failed to delete comment', err)
      });
    }
  }

  startEditComment(comment: Comment) {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.text;
  }

  cancelEditComment() {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  saveEditComment(comment: Comment) {
    if (!this.editCommentText.trim() || this.editCommentText === comment.text) {
      this.cancelEditComment();
      return;
    }

    this.postService.editComment(this.post.id, comment.id, this.editCommentText).subscribe({
      next: (updatedComment) => {
        comment.text = updatedComment.text;
        this.cancelEditComment();
      },
      error: (err) => console.error('Failed to update comment', err)
    });
  }
}