import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';

import { ToastMessage, ToastPosition, ToastType } from './toast.model';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-retro-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-toast.component.html',
  styleUrl: './retro-toast.component.scss',
})
export class RetroToastComponent {
  readonly position   = input<ToastPosition>('bottom-right');
  readonly maxVisible = input(5);

  readonly toastClosed = output<ToastMessage>();

  protected readonly service = inject(ToastService);

  protected readonly visibleToasts = computed(() =>
    this.service.toasts().slice(-this.maxVisible()),
  );

  private readonly expandedIds = signal(new Set<string>());
  private readonly pausedIds   = signal(new Set<string>());

  protected isExpanded(id: string): boolean { return this.expandedIds().has(id); }
  protected isPaused(id: string):   boolean { return this.pausedIds().has(id); }

  protected toggleExpanded(id: string): void {
    this.expandedIds.update((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected onMouseEnter(id: string): void {
    this.service.pause(id);
    this.pausedIds.update((prev) => new Set([...prev, id]));
  }

  protected onMouseLeave(id: string): void {
    this.service.resume(id);
    this.pausedIds.update((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  protected dismiss(toast: ToastMessage): void {
    this.expandedIds.update((prev) => { const n = new Set(prev); n.delete(toast.id); return n; });
    this.pausedIds.update((prev)   => { const n = new Set(prev); n.delete(toast.id); return n; });
    this.service.dismiss(toast.id);
    this.toastClosed.emit(toast);
  }

  protected badgeLabel(type: ToastType): string {
    return { event: 'EVENT', success: 'OK', warning: 'WARN', error: 'ERROR' }[type];
  }

  protected copyDetails(toast: ToastMessage): void {
    const d = toast.details;
    if (!d) return;
    const lines = [
      d.code    ? `code: ${d.code}`        : null,
      d.service ? `service: ${d.service}`  : null,
      d.http    ? `http: ${d.http}`        : null,
      d.trace   ? `trace: ${d.trace}`      : null,
      d.stack   ? `\n// STACK\n${d.stack}` : null,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
  }

  protected openAction(url: string): void {
    window.open(url, '_blank', 'noopener');
  }
}
