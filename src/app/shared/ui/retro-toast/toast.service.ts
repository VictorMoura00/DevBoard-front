import { Injectable, signal } from '@angular/core';

import { ToastDetails, ToastMessage, ToastType } from './toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  show(
    message: string,
    type: ToastType = 'event',
    duration = 3400,
    details?: ToastDetails,
    sticky = false,
  ): void {
    const id         = crypto.randomUUID();
    const isSticky   = sticky || duration === 0;
    const life       = isSticky ? undefined : duration;
    const msg: ToastMessage = { id, message, type, details, life, sticky: isSticky };

    this.toasts.update((t) => [...t, msg]);

    if (life) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), life));
    }
  }

  dismiss(id: string): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
    const timer = this.timers.get(id);
    if (timer) { clearTimeout(timer); this.timers.delete(id); }
  }

  /** Dismiss all visible toasts immediately. */
  clear(): void {
    this.toasts().map((t) => t.id).forEach((id) => this.dismiss(id));
  }

  event(message: string, details?: ToastDetails, duration?: number, sticky?: boolean): void {
    this.show(message, 'event', duration, details, sticky);
  }

  success(message: string, details?: ToastDetails, duration?: number, sticky?: boolean): void {
    this.show(message, 'success', duration, details, sticky);
  }

  warning(message: string, details?: ToastDetails, duration?: number, sticky?: boolean): void {
    this.show(message, 'warning', duration, details, sticky);
  }

  error(message: string, details?: ToastDetails, duration?: number, sticky?: boolean): void {
    this.show(message, 'error', duration, details, sticky);
  }
}
