import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private API_URL = 'http://localhost:8080/api/posts';

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {};
    }
    const token = localStorage.getItem('auth-token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.API_URL, this.getAuthHeaders());
  }

  createPost(formData: FormData): Observable<any> {
    return this.http.post(`${this.API_URL}/upload`, formData, this.getAuthHeaders());
  }

  getComments(postId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/comments/${postId}`, this.getAuthHeaders());
  }

  addComment(postId: number, content: string): Observable<any> {
    return this.http.post(
      `${this.API_URL}/comments/${postId}`,
      { content },
      this.getAuthHeaders()
    );
  }
}