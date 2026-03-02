import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './post-detail.html',
  styleUrls: ['./post-detail.scss']
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);
  private router = inject(Router);

  post: Post | null = null;
  isLoading: boolean = true;
  currentUser = this.getCurrentUsername();

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const postId = Number(params.get('id'));
      if (postId) {
        this.loadPost(postId);
      }
    });
  }

  onPostDeleted() {
    this.router.navigate(['/feed']);
  }

  loadPost(id: number) {
    this.isLoading = true;
    this.postService.getPostById(id).subscribe({
      next: (data) => {
        this.post = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load post', err);
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