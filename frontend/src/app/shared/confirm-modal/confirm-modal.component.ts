import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onCancel()" role="dialog" aria-modal="true">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-icon" [ngClass]="danger ? 'icon-danger' : 'icon-info'">
            <i [class]="danger ? 'ri-error-warning-line' : 'ri-question-line'" aria-hidden="true"></i>
          </div>
          <div>
            <h3 class="modal-title">{{ title }}</h3>
            <p class="modal-message">{{ message }}</p>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="btn"
            [ngClass]="danger ? 'btn-danger' : 'btn-primary'"
            (click)="onConfirm()"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 31, 32, 0.75);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 1050;
      padding: 1rem;
    }

    .modal-card {
      background: var(--bg-card, #163832);
      border: 1px solid var(--border-color, #235347);
      border-radius: var(--radius-lg, 12px);
      padding: 1.5rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      animation: modal-enter 0.15s ease-out;
    }

    .modal-header {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .modal-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .icon-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .icon-info {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    .modal-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary, #daf1de);
      margin: 0 0 0.35rem 0;
    }

    .modal-message {
      font-size: 0.88rem;
      color: var(--text-secondary, #8eb69b);
      margin: 0;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-danger {
      background-color: #ef4444;
      color: #ffffff;
      border: 1px solid #dc2626;
    }

    .btn-danger:hover {
      background-color: #dc2626;
    }

    @keyframes modal-enter {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() danger = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
