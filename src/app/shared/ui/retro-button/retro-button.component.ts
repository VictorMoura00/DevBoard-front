import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type RetroButtonVariant = 'primary' | 'secondary' | 'ghost';
type RetroButtonSize = 'md' | 'sm';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-retro-button',
  standalone: true,
  templateUrl: './retro-button.component.html',
  styleUrl: './retro-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'retro-button-host',
  },
})
export class RetroButtonComponent {
  readonly variant = input<RetroButtonVariant>('primary');
  readonly size = input<RetroButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly disabled = input(false);
  readonly pressed = output<MouseEvent>();

  protected readonly classes = computed(
    () => `retro-button retro-button--${this.variant()} retro-button--${this.size()}`,
  );

  protected onClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.pressed.emit(event);
    }
  }
}
