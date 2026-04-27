import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type Visibility = 'public' | 'private' | 'internal';

const LABELS: Record<Visibility, string> = { public: 'PUB', private: 'PRIV', internal: 'INT' };

@Component({
  selector: 'app-visibility-chip',
  standalone: true,
  template: `<span class="vc vc--{{ visibility() }}">[{{ label() }}]</span>`,
  styleUrl: './visibility-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityChipComponent {
  readonly visibility = input<Visibility>('public');
  protected readonly label = computed(() => LABELS[this.visibility()]);
}
