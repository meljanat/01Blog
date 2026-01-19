import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form = { username: '', password: '' };

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.authService.login(this.form).subscribe({
      next: (data) => {
        this.authService.saveToken(data.token);
        this.router.navigate(['/home']);
        console.log(data);
      },
      error: (err) => alert(err.error.message)
    });
  }
}