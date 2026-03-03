import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userData = { username: '', email: '', password: '' };
  errorMessage = '';
  successMessage = '';
  bio = '';
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    // Build the FormData payload
    const formData = new FormData();
    formData.append('username', this.userData.username);
    formData.append('email', this.userData.email);
    formData.append('password', this.userData.password);

    if (this.bio.trim()) {
      formData.append('bio', this.bio);
    }

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.authService.register(formData).subscribe({
      next: (res) => {
        console.log('Registration successful', res);
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Registration failed', err)
    });
  }
}