import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type RetroInputType = 'text' | 'search' | 'number' | 'email' | 'password';
export type RetroInputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-retro-input',
  standalone: true,
  templateUrl: './retro-input.component.html',
  styleUrl: './retro-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-full-width]': 'fullWidth()' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RetroInputComponent), multi: true }],
})
export class RetroInputComponent implements ControlValueAccessor {
  private readonly inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  readonly value        = input('');
  readonly placeholder  = input('');
  readonly ariaLabel    = input('');
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

  protected readonly _value       = linkedSignal(() => this.value());
  protected readonly _cvaDisabled = signal(false);

  protected readonly showClear = computed(
    () => this.clearable() && this._value().length > 0 && !this.disabled() && !this._cvaDisabled() && !this.readonly(),
  );

  private _onChange:  (v: string) => void = () => {};
  private _onTouched: () => void           = () => {};

  writeValue(v: string): void                     { this._value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void         { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void       { this._cvaDisabled.set(disabled); }

  protected onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this._value.set(v);
    this._onChange(v);
    this.valueChange.emit(v);
  }

  protected onBlur(): void { this._onTouched(); }

  protected onClear(): void {
    this._value.set('');
    this._onChange('');
    this.valueChange.emit('');
    this.cleared.emit();
  }

  focus(): void {
    this.inputElement().nativeElement.focus();
    this.inputElement().nativeElement.select();
  }
}
