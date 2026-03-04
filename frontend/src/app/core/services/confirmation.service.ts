import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  action: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private confirmSubject = new Subject<ConfirmData | null>();

  confirmState$ = this.confirmSubject.asObservable();

  requireConfirmation(data: ConfirmData) {
    this.confirmSubject.next(data);
  }

  close() {
    this.confirmSubject.next(null);
  }
}