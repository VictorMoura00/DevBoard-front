import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type RetroInputType = 'text' | 'search' | 'number' | 'email' | 'password';

@Component({
  selector: 'app-retro-input',
  standalone: true,
  templateUrl: './retro-input.component.html',
  styleUrl: './retro-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroInputComponent {
  readonly value = input('');
  readonly placeholder = input('');
  readonly type = input<RetroInputType>('text');
  readonly prefix = input('');
  readonly suffix = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly errorMessage = input('');
  readonly clearable = input(false);

  readonly valueChange = output<string>();
  readonly cleared = output<void>();

  protected readonly showClear = computed(
    () => this.clearable() && this.value().length > 0 && !this.disabled(),
  );

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected onClear(): void {
    this.valueChange.emit('');
    this.cleared.emit();
  }
}
