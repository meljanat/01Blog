import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';

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

  reason: string = '';
  isSubmitting: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  submit() {
    if (!this.reason.trim()) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.reportService.submitReport(this.targetType, this.targetId, this.reason).subscribe({
      next: (res) => {
        this.successMessage = 'Report submitted successfully.';
        this.isSubmitting = false;
        // Auto-close after 2 seconds
        setTimeout(() => this.close(), 2000);
      },
      error: (err) => {
        this.errorMessage = 'Failed to submit report. Please try again.';
        this.isSubmitting = false;
        console.error(err);
      }
    });
  }

  close() {
    this.closeModal.emit();
  }
}