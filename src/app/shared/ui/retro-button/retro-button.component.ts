import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type RetroButtonVariant = 'primary' | 'secondary' | 'ghost';
export type RetroButtonTone    = 'default' | 'success' | 'warning' | 'danger';
export type RetroButtonSize    = 'sm' | 'md' | 'lg';
export type RetroButtonIconPos = 'left' | 'right';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-retro-button',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './retro-button.component.html',
  styleUrl: './retro-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'retro-button-host',
    '[class.retro-button-host--full]': 'fullWidth()',
  },
})
export class RetroButtonComponent {
  // ── Appearance ────────────────────────────────────────────────────────────
  /** Structure of the button: filled, outlined or ghost. */
  readonly variant  = input<RetroButtonVariant>('primary');

  /** Semantic color intent, orthogonal to variant. */
  readonly tone     = input<RetroButtonTone>('default');

  readonly size     = input<RetroButtonSize>('md');

  // ── Icon ──────────────────────────────────────────────────────────────────
  /** Text glyph to show as icon, e.g. '→', '+', '✕'. */
  readonly icon     = input('');
  readonly iconPos  = input<RetroButtonIconPos>('left');

  // ── Badge ─────────────────────────────────────────────────────────────────
  /** Small counter/label overlaid on the button corner. */
  readonly badge    = input<string | number | null>(null);

  // ── Link rendering ────────────────────────────────────────────────────────
  /** When set, renders an <a> element instead of <button>. */
  readonly href     = input('');

  // ── State ─────────────────────────────────────────────────────────────────
  readonly type      = input<ButtonType>('button');
  readonly disabled  = input(false);
  readonly loading   = input(false);
  readonly fullWidth = input(false);

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly pressed = output<MouseEvent>();
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();

  // ── Derived ───────────────────────────────────────────────────────────────
  protected readonly classes = computed(() => {
    const parts = [
      'retro-button',
      `retro-button--${this.variant()}`,
      `retro-button--size-${this.size()}`,
      `retro-button--tone-${this.tone()}`,
    ];
    if (this.loading())   parts.push('retro-button--loading');
    if (this.fullWidth()) parts.push('retro-button--full');
    return parts.join(' ');
  });

  protected readonly showIconLeft  = computed(() => !!this.icon() && this.iconPos() === 'left');
  protected readonly showIconRight = computed(() => !!this.icon() && this.iconPos() === 'right');
  protected readonly hasBadge      = computed(() => this.badge() !== null && this.badge() !== undefined);

  // ── Handlers ─────────────────────────────────────────────────────────────
  protected onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) this.pressed.emit(event);
  }
  protected onFocus(event: FocusEvent): void { this.focused.emit(event); }
  protected onBlur(event: FocusEvent):  void { this.blurred.emit(event); }
}
