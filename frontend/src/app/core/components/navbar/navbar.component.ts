import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
      } catch (e) {
        console.error('Error decoding token', e);
      }
    }
  }

  loadNotifications() {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount = count,
      error: (err) => console.error('Error fetching unread count', err)
    });

    this.notificationService.getNotifications().subscribe({
      next: (data) => this.notifications = data,
      error: (err) => console.error('Error fetching notifications', err)
    });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  handleNotificationClick(notification: any, event: Event) {
    event.stopPropagation();

    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }

    this.isDropdownOpen = false;
    this.router.navigate(['/post', notification.postId]);
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