import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminAnalytics {
  users: {
    total: number;
    active: number;
    banned: number;
    admins: number;
  };
  posts: {
    total: number;
    visible: number;
    hidden: number;
  };
  reports: {
    total: number;
    unresolved: number;
    resolved: number;
  };
  comments: {
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';
  private http = inject(HttpClient);

  getAnalytics(): Observable<AdminAnalytics> {
    return this.http.get<AdminAnalytics>(`${this.apiUrl}/analytics`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  getAllPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/posts`);
  }

  getUnresolvedReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports`);
  }

  resolveReport(reportId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/reports/${reportId}/resolve`, {}, { responseType: 'text' });
  }

  banUser(userId: number, reason: string, duration: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/ban`, { reason, duration });
  }

  unbanUser(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/unban`, {});
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { responseType: 'text' });
  }

  deletePost(postId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${postId}`, { responseType: 'text' });
  }

  setPostHidden(postId: number, hidden: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/posts/${postId}/visibility`, { hidden });
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${commentId}`, { responseType: 'text' });
  }
}
