import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProgressTone = 'default' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-retro-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-progress.component.html',
  styleUrl: './retro-progress.component.scss',
})
export class RetroProgressComponent {
  readonly value = input.required<number>();
  readonly tone = input<ProgressTone>('default');
  readonly label = input('');
  readonly showValue = input(false);
  readonly animated = input(false);

  protected readonly pct = computed(() => Math.max(0, Math.min(100, this.value())));
}
