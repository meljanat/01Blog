import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/auth';

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { responseType: 'text' });
  }

  register(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, formData, { responseType: 'text' });
  }
}