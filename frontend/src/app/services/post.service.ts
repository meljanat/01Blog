import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private API_URL = 'http://localhost:8080/api/posts';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth-token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.API_URL);
  }

  createPost(formData: FormData): Observable<any> {
    return this.http.post(this.API_URL + '/upload', formData, {
      headers: this.getAuthHeaders()
    });
  }
}