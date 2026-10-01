import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast"
        [ngClass]="'toast-' + toast.type"
      >
        <i
          [class]="
            toast.type === 'success'
              ? 'ri-checkbox-circle-fill'
              : toast.type === 'error'
              ? 'ri-error-warning-fill'
              : toast.type === 'warning'
              ? 'ri-alert-fill'
              : 'ri-information-fill'
          "
          [style.color]="
            toast.type === 'success'
              ? 'var(--color-success)'
              : toast.type === 'error'
              ? 'var(--color-danger)'
              : toast.type === 'warning'
              ? 'var(--color-warning)'
              : 'var(--color-info)'
          "
          style="font-size: 1.25rem; margin-top: 1px;"
        ></i>
        <div style="flex: 1;">
          <div *ngIf="toast.title" style="font-weight: 600; font-size: 0.82rem; margin-bottom: 2px;">
            {{ toast.title }}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            {{ toast.message }}
          </div>
        </div>
        <button
          type="button"
          (click)="toastService.remove(toast.id)"
          class="btn btn-ghost btn-sm"
          style="padding: 2px 6px; color: var(--text-muted);"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  public toastService = inject(ToastService);
}
