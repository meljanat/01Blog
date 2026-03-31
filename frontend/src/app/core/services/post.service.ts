import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Post, Comment } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = 'http://localhost:8080/api/posts';
  private http = inject(HttpClient);

  getFeed(lastId: number | null, size: number = 10): Observable<any[]> {
    let url = `${this.apiUrl}?size=${size}`;
    if (lastId) {
      url += `&lastId=${lastId}`;
    }
    return this.http.get<any[]>(url);
  }

  getPostById(postId: number): Observable<Post> {
    return this.http.get<any>(`${this.apiUrl}/${postId}`).pipe(
      map(item => new Post(item))
    );
  }

  getUserPosts(username: string, lastId: number | null, size: number = 10): Observable<any[]> {
    let url = `${this.apiUrl}/user/${username}?size=${size}`;
    if (lastId) {
      url += `&lastId=${lastId}`;
    }
    return this.http.get<any[]>(url);
  }

  getComments(postId: number, lastId: number | null, size: number = 5): Observable<any[]> {
    let url = `${this.apiUrl}/${postId}/comments?size=${size}`;
    if (lastId) {
      url += `&lastId=${lastId}`;
    }
    return this.http.get<any[]>(url);
  }

  createPost(formData: FormData): Observable<Post> {
    return this.http.post<any>(this.apiUrl, formData).pipe(
      map(item => new Post(item))
    );
  }

  updatePost(postId: number, newText: string): Observable<Post> {
    return this.http.put<any>(`${this.apiUrl}/${postId}`, newText, {
      headers: { 'Content-Type': 'text/plain' }
    }).pipe(
      map(item => new Post(item))
    );
  }

  deletePost(postId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${postId}`, { responseType: 'text' });
  }

  likePost(postId: number): Observable<Post> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/like`, {}).pipe(
      map(item => new Post(item))
    );
  }

  addComment(postId: number, text: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, text, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  editComment(postId: number, commentId: number, newText: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${postId}/comments/${commentId}`, newText, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  deleteComment(postId: number, commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${postId}/comments/${commentId}`, { responseType: 'text' });
  }
}