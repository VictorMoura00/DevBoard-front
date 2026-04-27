import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-retro-range',
  standalone: true,
  templateUrl: './retro-range.component.html',
  styleUrl: './retro-range.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-full-width]': 'fullWidth()' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RetroRangeComponent), multi: true }],
})
export class RetroRangeComponent implements ControlValueAccessor {
  readonly value     = input(0);
  readonly min       = input(0);
  readonly max       = input(100);
  readonly step      = input(1);
  readonly disabled  = input(false);
  readonly fullWidth = input(false);
  readonly showValue = input(false);
  readonly label     = input('');
  readonly ariaLabel = input('');

  readonly valueChange = output<number>();

  protected readonly _value       = linkedSignal(() => this.value());
  protected readonly _cvaDisabled = signal(false);

  private _onChange:  (v: number) => void = () => {};
  private _onTouched: () => void           = () => {};

  writeValue(v: number): void                     { this._value.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void         { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void       { this._cvaDisabled.set(disabled); }

  protected onInput(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    this._value.set(v);
    this._onChange(v);
    this.valueChange.emit(v);
  }

  protected onBlur(): void { this._onTouched(); }
}
