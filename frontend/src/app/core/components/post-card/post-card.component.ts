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

  editingCommentId: number | null = null;
  editCommentText: string = '';

  showReportModal = false;
  reportType: 'POST' | 'COMMENT' = 'POST';
  reportTargetId: number = 0;

  openReportModal(type: 'POST' | 'COMMENT', id: number) {
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

  toggleLike() {
    this.post.toggleLocalLike(this.currentUser);
    this.postService.likePost(this.post.id).subscribe({
      next: (updatedPost) => this.post.likes = updatedPost.likes,
      error: (err) => {
        console.error('Failed to toggle like', err);
        this.post.toggleLocalLike(this.currentUser);
      }
    });
  }

  submitComment() {
    if (!this.newCommentText.trim()) return;
    this.postService.addComment(this.post.id, this.newCommentText).subscribe({
      next: (newComment) => {
        this.post.addLocalComment(newComment);
        this.newCommentText = '';
      },
      error: (err) => console.error('Failed to post comment', err)
    });
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

  deleteComment(commentId: number) {
    if (confirm('Delete this comment?')) {
      this.postService.deleteComment(this.post.id, commentId).subscribe({
        next: () => {
          this.post.comments = this.post.comments.filter(c => c.id !== commentId);
        },
        error: (err) => console.error('Failed to delete comment', err)
      });
    }
  }
}