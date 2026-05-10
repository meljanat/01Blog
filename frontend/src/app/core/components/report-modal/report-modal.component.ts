import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-modal.html',
  styleUrls: ['./report-modal.scss']
})
export class ReportModalComponent {
  @Input({ required: true }) targetType!: 'USER' | 'POST';
  @Input({ required: true }) targetId!: number;
  @Output() closeModal = new EventEmitter<void>();

  private reportService = inject(ReportService);
  private confirmationService = inject(ConfirmationService);

  reason: string = '';
  isSubmitting: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  submit() {
    if (!this.reason.trim()) return;

    this.confirmationService.requireConfirmation({
      title: `Submit ${this.targetType.toLowerCase()} report`,
      message: 'Send this report to the admin moderation queue?',
      confirmText: 'Submit Report',
      isDanger: true,
      action: () => this.sendReport()
    });
  }

  private sendReport() {
    this.isSubmitting = true;
    this.errorMessage = '';

    this.reportService.submitReport(this.targetType, this.targetId, this.reason).subscribe({
      next: (res) => {
        this.successMessage = 'Report submitted successfully.';
        this.isSubmitting = false;
        setTimeout(() => this.close(), 2000);
      },
      error: () => {
        this.errorMessage = 'Failed to submit report. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  close() {
    this.closeModal.emit();
  }
}
