import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = 'http://localhost:8080/api/auth/';

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(this.API_URL + 'signin', credentials);
  }

  register(user: any): Observable<any> {
    return this.http.post(this.API_URL + 'signup', user);
  }

  saveToken(token: string) {
    localStorage.setItem('auth-token', token);
  }

  getToken() {
    return localStorage.getItem('auth-token');
  }
}