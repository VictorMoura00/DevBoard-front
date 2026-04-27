import { Injectable, signal } from '@angular/core';

import { ToastDetails, ToastMessage, ToastType } from './toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  private readonly timers    = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly remaining = new Map<string, number>();
  private readonly startedAt = new Map<string, number>();

  show(
    message: string,
    type: ToastType = 'event',
    duration = 3400,
    details?: ToastDetails,
    sticky = false,
  ): void {
    const id       = crypto.randomUUID();
    const isSticky = sticky || duration === 0;
    const life     = isSticky ? undefined : duration;
    const msg: ToastMessage = { id, message, type, details, life, sticky: isSticky };

    this.toasts.update((t) => [...t, msg]);

    if (life) {
      this._startTimer(id, life);
    }
  }

  pause(id: string): void {
    if (!this.timers.has(id)) return;
    const elapsed = Date.now() - (this.startedAt.get(id) ?? Date.now());
    const rem     = Math.max(0, (this.remaining.get(id) ?? 0) - elapsed);
    clearTimeout(this.timers.get(id)!);
    this.timers.delete(id);
    this.remaining.set(id, rem);
  }

  resume(id: string): void {
    if (this.timers.has(id)) return;
    const rem = this.remaining.get(id);
    if (rem === undefined) return;
    this._startTimer(id, rem);
  }

  dismiss(id: string): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.remaining.delete(id);
    this.startedAt.delete(id);
  }

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

  private _startTimer(id: string, ms: number): void {
    this.remaining.set(id, ms);
    this.startedAt.set(id, Date.now());
    this.timers.set(id, setTimeout(() => this.dismiss(id), ms));
  }
}
