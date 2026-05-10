import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { TimeDisplayPipe } from '../../../core/pipes/time-display.pipe';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TimeDisplayPipe],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.scss']
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmService = inject(ConfirmationService);

  users: any[] = [];
  isLoading: boolean = true;
  selectedBanUser: any | null = null;
  banReason = '';
  banDuration = 'ONE_DAY';
  banDurations = [
    { value: 'ONE_DAY', label: '1 day' },
    { value: 'THREE_DAYS', label: '3 days' },
    { value: 'ONE_WEEK', label: '1 week' },
    { value: 'PERMANENT', label: 'Permanent' }
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleBan(user: any) {
    if (!user.isBanned) {
      this.openBanModal(user);
      return;
    }

    this.confirmService.requireConfirmation({
      title: 'Unban User',
      message: `Restore access for @${user.username}?`,
      confirmText: 'Unban User',
      isDanger: false,
      action: () => {
        this.adminService.unbanUser(user.id).subscribe({
          next: (updatedUser) => Object.assign(user, updatedUser),
          error: () => {}
        });
      }
    });
  }

  openBanModal(user: any) {
    this.selectedBanUser = user;
    this.banReason = '';
    this.banDuration = 'ONE_DAY';
  }

  closeBanModal() {
    this.selectedBanUser = null;
    this.banReason = '';
    this.banDuration = 'ONE_DAY';
  }

  submitBan() {
    if (!this.selectedBanUser || !this.banReason.trim()) return;

    const user = this.selectedBanUser;
    this.adminService.banUser(user.id, this.banReason, this.banDuration).subscribe({
      next: (updatedUser) => {
        Object.assign(user, updatedUser);
        this.closeBanModal();
      },
      error: () => {}
    });
  }

  deleteUser(user: any) {
    this.confirmService.requireConfirmation({
      title: 'Delete User',
      message: `Permanently delete @${user.username} and all related content? This action cannot be undone.`,
      confirmText: 'Delete User',
      isDanger: true,
      action: () => {
        this.adminService.deleteUser(user.id).subscribe({
          next: () => {
            this.users = this.users.filter(existingUser => existingUser.id !== user.id);
          },
          error: () => {}
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
