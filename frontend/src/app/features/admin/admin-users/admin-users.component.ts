import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.scss']
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmService = inject(ConfirmationService);

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

  toggleBan(user: any) {
    const action = user.isBanned ? 'UNBAN' : 'BAN';
    this.confirmService.requireConfirmation({
      title: `${action === 'BAN' ? 'Ban' : 'Unban'} User`,
      message: `Are you sure you want to ${action.toLowerCase()} @${user.username}?`,
      confirmText: 'Yes, do it',
      isDanger: action === 'BAN',
      action: () => {
        this.adminService.toggleBanUser(user.id).subscribe({
          next: () => {
            if (user.isBanned !== undefined) { user.isBanned = !user.isBanned; }
          },
          error: (err) => console.error(`Failed to ${action} user`, err)
        });
      }
    });
  }

  checkIsBanned(user: any): boolean {
    return user.isBanned !== undefined ? user.isBanned : false;
  }

  isAdmin(user: any): boolean {
    if (!user.role) return false;
    return user.role === 'ADMIN' || user.role === 'ROLE_ADMIN';
  }

  getRoleName(user: any): string {
    if (!user.role) return 'USER';
    return user.role.replace('ROLE_', '');
  }
}