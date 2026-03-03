import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Post, Comment } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = 'http://localhost:8080/api/posts';
  private http = inject(HttpClient);

  getAllPosts(): Observable<Post[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(data => data.map(item => new Post(item)))
    );
  }

  getPostById(postId: number): Observable<Post> {
    return this.http.get<any>(`${this.apiUrl}/${postId}`).pipe(
      map(item => new Post(item))
    );
  }

  getPostsByUser(username: string): Observable<Post[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${username}`).pipe(
      map(data => data.map(item => new Post(item)))
    );
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