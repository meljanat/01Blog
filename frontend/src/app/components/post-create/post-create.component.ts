import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css']
})
export class PostCreateComponent {
  postData = { title: '', content: '' };
  selectedFile: File | null = null;
  mediaPreview: string | null = null;
  isSubmitting = false;

  constructor(private postService: PostService, private router: Router) { }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.mediaPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeMedia() {
    this.selectedFile = null;
    this.mediaPreview = null;
  }

  onSubmit() {
    if (!this.postData.title && !this.postData.content && !this.selectedFile) {
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('title', this.postData.title);
    formData.append('content', this.postData.content);

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.postService.createPost(formData).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error(err);
        alert('Failed to post. Please try again.');
        this.isSubmitting = false;
      }
    });
  }
}