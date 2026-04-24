import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusDotSize = 'xs' | 'sm' | 'md';

@Component({
  selector: 'app-status-dot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()"></span>`,
  styleUrl: './status-dot.component.scss',
})
export class StatusDotComponent {
  readonly status = input.required<string>();
  readonly size = input<StatusDotSize>('sm');
  readonly pulse = input(false);

  protected readonly classes = computed(() => {
    const c = ['dot', `dot--${this.status()}`, `dot--${this.size()}`];
    if (this.pulse()) c.push('dot--pulse');
    return c.join(' ');
  });
}
