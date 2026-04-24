import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-ascii-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ascii-bar">{{ bar() }}</span>`,
  styleUrl: './ascii-bar.component.scss',
})
export class AsciiBarComponent {
  readonly value = input.required<number>();
  readonly width = input(20);
  readonly filledChar = input('█');
  readonly emptyChar = input('░');
  readonly showValue = input(true);

  protected readonly bar = computed(() => {
    const pct = Math.max(0, Math.min(100, this.value()));
    const total = this.width();
    const filled = Math.round((pct / 100) * total);
    const barStr = this.filledChar().repeat(filled) + this.emptyChar().repeat(total - filled);
    return this.showValue() ? `[${barStr}] ${String(pct).padStart(3)}%` : `[${barStr}]`;
  });
}
