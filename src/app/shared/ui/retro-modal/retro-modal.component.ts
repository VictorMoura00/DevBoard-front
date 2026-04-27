import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-retro-modal',
  standalone: true,
  templateUrl: './retro-modal.component.html',
  styleUrl: './retro-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(keydown)':                 'onKeydown($event)',
  },
})
export class RetroModalComponent {
  private readonly windowEl = viewChild<ElementRef<HTMLElement>>('modalWindow');

  readonly open            = input(false);
  readonly title           = input('');
  readonly subtitle        = input('');
  readonly size            = input<'sm' | 'md' | 'lg'>('md');
  readonly closeOnBackdrop = input(true);
  readonly closeOnEscape   = input(true);
  readonly showCloseButton = input(true);
  readonly closed          = output<void>();

  private readonly _autoFocus = effect(() => {
    if (this.open()) {
      queueMicrotask(() => {
        const el = this.windowEl()?.nativeElement;
        if (!el) return;
        const first = el.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? el).focus();
      });
    }
  });

  protected onEscape(): void {
    if (this.open() && this.closeOnEscape()) this.closed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.open() || event.key !== 'Tab') return;
    const el = this.windowEl()?.nativeElement;
    if (!el) return;
    const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) { event.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { event.preventDefault(); first.focus(); }
    }
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdrop()) this.closed.emit();
  }

  protected onWindowClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
