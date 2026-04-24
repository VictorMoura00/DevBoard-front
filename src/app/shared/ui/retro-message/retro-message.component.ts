import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export type MessageSeverity = 'info' | 'success' | 'warning' | 'error';
export type MessageVariant  = 'filled' | 'outlined' | 'ghost';

@Component({
  selector: 'app-retro-message',
  standalone: true,
  templateUrl: './retro-message.component.html',
  styleUrl: './retro-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-closed]': '_closed()',
  },
})
export class RetroMessageComponent {
  readonly severity = input<MessageSeverity>('info');
  readonly variant  = input<MessageVariant>('filled');
  readonly text     = input('');
  readonly closable = input(false);
  /** Override the leading glyph icon. Defaults to severity icon. */
  readonly icon     = input('');

  readonly msgClosed = output<void>();

  protected readonly _closed = signal(false);

  protected readonly defaultIcon = computed(() => ({
    info:    'ℹ',
    success: '✓',
    warning: '⚠',
    error:   '✕',
  }[this.severity()]));

  protected readonly effectiveIcon = computed(() => this.icon() || this.defaultIcon());

  protected readonly badge = computed(() => ({
    info:    'INFO',
    success: 'OK',
    warning: 'WARN',
    error:   'ERROR',
  }[this.severity()]));

  close(): void {
    this._closed.set(true);
    this.msgClosed.emit();
  }
}
