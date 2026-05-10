import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { TimeDisplayPipe } from '../../pipes/time-display.pipe';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeDisplayPipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private hasLoadedNotifications = false;

  notifications: any[] = [];
  unreadCount: number = 0;
  isDropdownOpen: boolean = false;

  currentUser: string | null = null;
  isAdmin: boolean = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.refreshNavbarState();
    });
  }

  ngOnInit() {
    this.refreshNavbarState();
  }

  refreshNavbarState() {
    if (this.isLoggedIn()) {
      this.extractUserData();

      if (!this.hasLoadedNotifications) {
        this.loadNotifications();
        this.hasLoadedNotifications = true;
      }
    } else {
      this.currentUser = null;
      this.isAdmin = false;
      this.hasLoadedNotifications = false;
      this.notifications = [];
      this.unreadCount = 0;
    }
  }

  extractUserData() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser = payload.sub;
        this.isAdmin = JSON.stringify(payload.roles).includes('ROLE_ADMIN');
      } catch {
        localStorage.removeItem('token');
        this.currentUser = null;
        this.isAdmin = false;
      }
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.calculateUnread();
      },
      error: () => {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  calculateUnread() {
    this.notificationService.unreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  toggleNotification(event: Event, notification: any) {
    event.stopPropagation();
    event.preventDefault();

    this.notificationService.toggleReadStatus(notification.id).subscribe({
      next: () => {
        notification.read = !notification.read;
        this.calculateUnread();
      },
      error: () => {}
    });
  }

  readNotification(notification: any) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.read = true;
          this.calculateUnread();
        },
        error: () => {}
      });
    }

    this.isDropdownOpen = false;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser = null;
    this.isAdmin = false;
    this.router.navigate(['/login']);
  }
}
