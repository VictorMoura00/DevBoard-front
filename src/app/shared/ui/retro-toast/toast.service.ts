import { Injectable, signal } from '@angular/core';

import { ToastDetails, ToastMessage, ToastType } from './toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  show(message: string, type: ToastType = 'event', duration = 3400, details?: ToastDetails): void {
    const id = crypto.randomUUID();
    this.toasts.update((t) => [...t, { id, message, type, details }]);
    if (duration > 0) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), duration));
    }
  }

  dismiss(id: string): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
    const timer = this.timers.get(id);
    if (timer) { clearTimeout(timer); this.timers.delete(id); }
  }

  event(message: string, details?: ToastDetails, duration?: number): void {
    this.show(message, 'event', duration, details);
  }

  success(message: string, details?: ToastDetails, duration?: number): void {
    this.show(message, 'success', duration, details);
  }

  warning(message: string, details?: ToastDetails, duration?: number): void {
    this.show(message, 'warning', duration, details);
  }

  error(message: string, details?: ToastDetails, duration?: number): void {
    this.show(message, 'error', duration, details);
  }
}
