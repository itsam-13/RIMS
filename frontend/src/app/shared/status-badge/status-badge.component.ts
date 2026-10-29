import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()">
      <span class="badge-dot" aria-hidden="true"></span>
      {{ status }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .badge-info {
      background-color: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    .badge-purple {
      background-color: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.25);
    }

    .badge-success {
      background-color: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.25);
    }

    .badge-danger {
      background-color: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .badge-warning {
      background-color: rgba(234, 179, 8, 0.15);
      color: #facc15;
      border: 1px solid rgba(234, 179, 8, 0.25);
    }

    .badge-neutral {
      background-color: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';

  getBadgeClass(): string {
    const s = this.status?.toUpperCase() || '';
    switch (s) {
      case 'PLACED':
      case 'ORDERED':
        return 'badge-info';
      case 'SHIPPED':
        return 'badge-purple';
      case 'DELIVERED':
      case 'RECEIVED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      case 'PENDING':
      default:
        return 'badge-neutral';
    }
  }
}
