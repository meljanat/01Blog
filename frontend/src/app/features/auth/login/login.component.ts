import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = { username: '', password: '' };
  errorMessage = '';

  onSubmit() {
    this.errorMessage = '';
    this.authService.login(this.credentials).subscribe({
      next: (token) => {
        localStorage.setItem('token', token);
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.errorMessage = 'Invalid username or password. Please try again.';
      }
    });
  }
}