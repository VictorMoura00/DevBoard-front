import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-retro-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-tag.component.html',
  styleUrl: './retro-tag.component.scss',
})
export class RetroTagComponent {
  readonly label = input.required<string>();
  readonly variant = input<TagVariant>('default');
  readonly removable = input(false);
  readonly disabled = input(false);

  readonly removed = output<void>();

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled()) this.removed.emit();
  }
}
