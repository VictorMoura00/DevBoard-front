import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

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

  protected readonly service = inject(ToastService);

  protected readonly visibleToasts = computed(() =>
    this.service.toasts().slice(-this.maxVisible()),
  );

  private readonly expandedIds = signal(new Set<string>());

  protected isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  protected toggleExpanded(id: string): void {
    this.expandedIds.update((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected dismiss(id: string): void {
    this.expandedIds.update((prev) => { const n = new Set(prev); n.delete(id); return n; });
    this.service.dismiss(id);
  }

  protected badgeLabel(type: ToastType): string {
    return { event: 'EVENT', success: 'OK', warning: 'WARN', error: 'ERROR' }[type];
  }

  protected copyDetails(toast: ToastMessage): void {
    const d = toast.details;
    if (!d) return;
    const lines = [
      d.code    ? `code: ${d.code}`    : null,
      d.service ? `service: ${d.service}` : null,
      d.http    ? `http: ${d.http}`    : null,
      d.trace   ? `trace: ${d.trace}`  : null,
      d.stack   ? `\n// STACK\n${d.stack}` : null,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
  }

  protected openAction(url: string): void {
    window.open(url, '_blank', 'noopener');
  }
}
