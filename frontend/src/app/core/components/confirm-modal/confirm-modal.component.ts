import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmData } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrls: ['./confirm-modal.scss']
})
export class ConfirmModalComponent implements OnInit {
  private confirmService = inject(ConfirmationService);

  data: ConfirmData | null = null;

  ngOnInit() {
    this.confirmService.confirmState$.subscribe(state => {
      this.data = state;
    });
  }

  confirm() {
    if (this.data) {
      this.data.action();
      this.close();
    }
  }

  close() {
    this.confirmService.close();
  }
}