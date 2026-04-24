import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatBoxTone = 'default' | 'success' | 'warning' | 'danger';
export type StatBoxTrend = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-stat-box',
  standalone: true,
  templateUrl: './stat-box.component.html',
  styleUrl: './stat-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatBoxComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly sublabel = input('');
  readonly tone = input<StatBoxTone>('default');
  readonly trend = input<StatBoxTrend | undefined>(undefined);

  protected readonly trendIcon = computed(() => {
    const t = this.trend();
    if (t === 'up') return '↑';
    if (t === 'down') return '↓';
    if (t === 'neutral') return '→';
    return '';
  });

  protected readonly boxClass = computed(
    () => `stat-box stat-box--${this.tone()}`,
  );
}
