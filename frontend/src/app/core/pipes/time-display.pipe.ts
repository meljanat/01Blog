import { Pipe, PipeTransform } from '@angular/core';

type TimeDisplayMode = 'relative' | 'dateTime' | 'full';

@Pipe({
  name: 'timeDisplay',
  standalone: true,
  pure: false
})
export class TimeDisplayPipe implements PipeTransform {
  private readonly shortDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  private readonly fullDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  private readonly sameYearFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  transform(value: string | number | Date | null | undefined, mode: TimeDisplayMode = 'relative'): string {
    const date = this.parseDate(value);
    if (!date) {
      return '';
    }

    if (mode === 'full') {
      return this.fullDateTimeFormatter.format(date);
    }

    if (mode === 'dateTime') {
      return this.shortDateTimeFormatter.format(date);
    }

    return this.formatRelative(date);
  }

  private parseDate(value: string | number | Date | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const absMs = Math.abs(diffMs);
    const isFuture = diffMs < 0;

    const seconds = Math.round(absMs / 1000);
    if (seconds < 45) {
      return 'just now';
    }

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return this.relativeLabel(minutes, 'm', isFuture);
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return this.relativeLabel(hours, 'h', isFuture);
    }

    if (!isFuture && this.isYesterday(date, now)) {
      return `Yesterday at ${this.formatTime(date)}`;
    }

    if (date.getFullYear() === now.getFullYear()) {
      return this.sameYearFormatter.format(date);
    }

    return this.shortDateTimeFormatter.format(date);
  }

  private relativeLabel(amount: number, unit: string, isFuture: boolean): string {
    return isFuture ? `in ${amount}${unit}` : `${amount}${unit} ago`;
  }

  private isYesterday(date: Date, now: Date): boolean {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    return date.getFullYear() === yesterday.getFullYear()
      && date.getMonth() === yesterday.getMonth()
      && date.getDate() === yesterday.getDate();
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }
}
