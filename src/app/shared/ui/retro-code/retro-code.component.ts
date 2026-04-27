import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';

import { HighlightCodePipe } from './highlight-code.pipe';

@Component({
  selector: 'app-retro-code',
  standalone: true,
  imports: [HighlightCodePipe],
  templateUrl: './retro-code.component.html',
  styleUrl: './retro-code.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroCodeComponent {
  readonly code     = input.required<string>();
  readonly language = input('');
  readonly framed   = input(true);

  protected readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _cleanup = inject(DestroyRef).onDestroy(() => {
    if (this.copyTimer) clearTimeout(this.copyTimer);
  });

  protected copy(): void {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
