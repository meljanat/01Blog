import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.html',
  styleUrls: ['./admin-reports.scss']
})
export class AdminReportsComponent implements OnInit {
  private adminService = inject(AdminService);

  reports: any[] = [];
  isLoading: boolean = true;

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.adminService.getUnresolvedReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load reports', err);
        this.isLoading = false;
      }
    });
  }

  resolveReport(reportId: number) {
    if (confirm('Mark this report as resolved?')) {
      this.adminService.resolveReport(reportId).subscribe({
        next: () => {
          this.reports = this.reports.filter(r => r.id !== reportId);
        },
        error: (err) => console.error('Failed to resolve report', err)
      });
    }
  }
}