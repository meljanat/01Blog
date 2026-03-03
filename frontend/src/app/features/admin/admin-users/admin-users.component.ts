import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.scss']
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users: any[] = [];
  isLoading: boolean = true;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading = false;
      }
    });
  }
}