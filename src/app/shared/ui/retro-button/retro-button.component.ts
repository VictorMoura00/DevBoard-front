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
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly pressed = output<MouseEvent>();

  protected readonly classes = computed(() => {
    const parts = [
      'retro-button',
      `retro-button--${this.variant()}`,
      `retro-button--${this.size()}`,
    ];
    if (this.loading()) parts.push('retro-button--loading');
    if (this.fullWidth()) parts.push('retro-button--full');
    return parts.join(' ');
  });

  protected onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.pressed.emit(event);
    }
  }
}
