import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonShape     = 'rectangle' | 'circle';
export type SkeletonAnimation = 'wave' | 'pulse' | 'none';

@Component({
  selector: 'app-retro-skeleton',
  standalone: true,
  templateUrl: './retro-skeleton.component.html',
  styleUrl: './retro-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroSkeletonComponent {
  readonly width     = input('100%');
  readonly height    = input('14px');
  readonly shape     = input<SkeletonShape>('rectangle');
  readonly animation = input<SkeletonAnimation>('wave');
  /** Number of stacked skeleton rows. */
  readonly count     = input(1);

  protected readonly rows = computed(() => Array.from({ length: Math.max(1, this.count()) }));
  protected readonly isCircle = computed(() => this.shape() === 'circle');
}
