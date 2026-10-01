import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  show(type: ToastMessage['type'], message: string, title?: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, title, duration };
    this.toastsSignal.update(items => [...items, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, title = 'Success') {
    this.show('success', message, title);
  }

  error(message: string, title = 'Error') {
    this.show('error', message, title, 6000);
  }

  warning(message: string, title = 'Warning') {
    this.show('warning', message, title, 5000);
  }

  info(message: string, title = 'Notice') {
    this.show('info', message, title);
  }

  remove(id: string) {
    this.toastsSignal.update(items => items.filter(t => t.id !== id));
  }
}
