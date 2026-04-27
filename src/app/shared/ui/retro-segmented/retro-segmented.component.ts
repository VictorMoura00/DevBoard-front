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
  selector: 'app-retro-segmented',
  standalone: true,
  templateUrl: './retro-segmented.component.html',
  styleUrl: './retro-segmented.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[class.is-col]': "direction() === 'col'",
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RetroSegmentedComponent), multi: true }],
})
export class RetroSegmentedComponent implements ControlValueAccessor {
  readonly options   = input<readonly string[]>([]);
  readonly value     = input('');
  readonly direction = input<'row' | 'col'>('row');

  readonly valueChange = output<string>();

  protected readonly _value       = linkedSignal(() => this.value());
  protected readonly _cvaDisabled = signal(false);

  private _onChange:  (v: string) => void = () => {};
  private _onTouched: () => void           = () => {};

  writeValue(v: string): void                     { this._value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void         { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void       { this._cvaDisabled.set(disabled); }

  protected select(opt: string): void {
    if (this._cvaDisabled()) return;
    this._value.set(opt);
    this._onChange(opt);
    this._onTouched();
    this.valueChange.emit(opt);
  }
}
