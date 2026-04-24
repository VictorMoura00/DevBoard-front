import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProgressTone = 'default' | 'success' | 'warning' | 'danger';
export type ProgressMode = 'determinate' | 'indeterminate';

@Component({
  selector: 'app-retro-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-progress.component.html',
  styleUrl: './retro-progress.component.scss',
})
export class RetroProgressComponent {
  readonly value     = input<number>(0);
  readonly mode      = input<ProgressMode>('determinate');
  readonly tone      = input<ProgressTone>('default');
  readonly label     = input('');
  readonly unit      = input('%');
  readonly showValue = input(false);
  readonly animated  = input(false);

  protected readonly pct = computed(() => Math.max(0, Math.min(100, this.value())));
  protected readonly isDeterminate = computed(() => this.mode() === 'determinate');
}
