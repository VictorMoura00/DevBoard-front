import { ChangeDetectionStrategy, Component, OnDestroy, input, signal } from '@angular/core';

@Component({
  selector: 'app-retro-code',
  standalone: true,
  templateUrl: './retro-code.component.html',
  styleUrl: './retro-code.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroCodeComponent implements OnDestroy {
  readonly code = input.required<string>();
  readonly language = input('');
  readonly framed = input(true);

  protected readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  protected copy(): void {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(false), 2000);
    });
  }

  ngOnDestroy(): void {
    if (this.copyTimer) clearTimeout(this.copyTimer);
  }
}
