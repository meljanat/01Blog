import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: number;
  username: string;
  bio?: string;
  profilePictureUrl?: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';
  private http = inject(HttpClient);

  getUserProfile(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${username}`);
  }

  followUser(username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${username}/follow`, {}, { responseType: 'text' });
  }

  unfollowUser(username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${username}/unfollow`, {}, { responseType: 'text' });
  }
}