import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = 'http://localhost:8080/api/reports';
  private http = inject(HttpClient);

  submitReport(targetType: string, targetId: number, reason: string): Observable<any> {
    const payload = {
      targetType: targetType,
      targetId: targetId.toString(),
      reason: reason
    };

    return this.http.post(this.apiUrl, payload, { responseType: 'text' });
  }
}