import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = { username: '', password: '' };

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('auth-token')) {
        this.router.navigate(['/home']);
      }
    }
  }

  onLogin() {
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        localStorage.setItem('auth-token', res.token);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error(err);
        alert('Invalid username or password');
      }
    });
  }
}