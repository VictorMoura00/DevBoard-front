import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type RetroInputType = 'text' | 'search' | 'number' | 'email' | 'password';
export type RetroInputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-retro-input',
  standalone: true,
  templateUrl: './retro-input.component.html',
  styleUrl: './retro-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-full-width]': 'fullWidth()',
  },
})
export class RetroInputComponent {
  readonly value        = input('');
  readonly placeholder  = input('');
  readonly type         = input<RetroInputType>('text');
  readonly size         = input<RetroInputSize>('md');
  readonly prefix       = input('');
  readonly suffix       = input('');
  readonly disabled     = input(false);
  readonly readonly     = input(false);
  readonly invalid      = input(false);
  readonly errorMessage = input('');
  readonly helpText     = input('');
  readonly clearable    = input(false);
  readonly fullWidth    = input(false);

  readonly valueChange = output<string>();
  readonly cleared     = output<void>();

  protected readonly showClear = computed(
    () => this.clearable() && this.value().length > 0 && !this.disabled() && !this.readonly(),
  );

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected onClear(): void {
    this.valueChange.emit('');
    this.cleared.emit();
  }
}
