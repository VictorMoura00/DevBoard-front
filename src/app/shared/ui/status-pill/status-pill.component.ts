import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusPillSize = 'sm' | 'md';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  templateUrl: './status-pill.component.html',
  styleUrl: './status-pill.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPillComponent {
  readonly status = input.required<string>();
  readonly size = input<StatusPillSize>('sm');

  protected readonly pillClass = computed(
    () => `status-pill status-pill--${this.status()} status-pill--${this.size()}`,
  );
}
