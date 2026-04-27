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

export type RetroCheckboxSize = 'sm' | 'md';

@Component({
  selector: 'app-retro-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-checkbox.component.html',
  styleUrl: './retro-checkbox.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RetroCheckboxComponent), multi: true }],
})
export class RetroCheckboxComponent implements ControlValueAccessor {
  readonly checked       = input(false);
  readonly label         = input('');
  readonly ariaLabel     = input('');
  readonly size          = input<RetroCheckboxSize>('md');
  readonly disabled      = input(false);
  readonly readonly      = input(false);
  readonly invalid       = input(false);
  readonly indeterminate = input(false);
  readonly trueValue     = input<unknown>(true);
  readonly falseValue    = input<unknown>(false);

  readonly checkedChange = output<boolean>();
  readonly valueChange   = output<unknown>();

  protected readonly _checked     = linkedSignal(() => this.checked());
  protected readonly _cvaDisabled = signal(false);

  private _onChange:  (v: boolean) => void = () => {};
  private _onTouched: () => void            = () => {};

  writeValue(v: boolean): void                      { this._checked.set(!!v); }
  registerOnChange(fn: (v: boolean) => void): void  { this._onChange = fn; }
  registerOnTouched(fn: () => void): void           { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void         { this._cvaDisabled.set(disabled); }

  protected onChange(event: Event): void {
    if (this.readonly() || this.disabled() || this._cvaDisabled()) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this._checked.set(isChecked);
    this._onChange(isChecked);
    this.checkedChange.emit(isChecked);
    this.valueChange.emit(isChecked ? this.trueValue() : this.falseValue());
  }

  protected onBlur(): void { this._onTouched(); }
}
