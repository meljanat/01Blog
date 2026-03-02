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

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        if (response.includes('Error')) {
          this.errorMessage = response;
        } else {
          this.successMessage = 'Registration successful! Redirecting...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        }
      },
      error: (err) => {
        this.errorMessage = 'An error occurred during registration.';
      }
    });
  }
}