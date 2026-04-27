import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface RetroSelectOption {
  label:      string;
  value:      string;
  disabled?:  boolean;
  separator?: boolean;
}

@Component({
  selector: 'app-retro-select',
  standalone: true,
  templateUrl: './retro-select.component.html',
  styleUrl: './retro-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-full-width]': 'fullWidth()',
    '(document:click)':      'onDocClick($event)',
    '(keydown)':             'onKeydown($event)',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RetroSelectComponent), multi: true }],
})
export class RetroSelectComponent implements ControlValueAccessor {
  private readonly _el = inject(ElementRef<HTMLElement>);

  readonly value       = input('');
  readonly options     = input<RetroSelectOption[]>([]);
  readonly placeholder = input('');
  readonly ariaLabel   = input('');
  readonly size        = input<'sm' | 'md'>('md');
  readonly disabled    = input(false);
  readonly fullWidth   = input(false);

  readonly valueChange = output<string>();

  protected readonly _value       = linkedSignal(() => this.value());
  protected readonly _cvaDisabled = signal(false);
  protected readonly _open        = signal(false);
  protected readonly _focusIdx    = signal(-1);

  protected readonly _listboxId = `retro-select-${Math.random().toString(36).slice(2, 7)}`;

  protected readonly selectedLabel = computed(() =>
    this.options().find(o => o.value === this._value())?.label ?? '',
  );

  protected readonly activeDescendant = computed(() => {
    if (!this._open() || this._focusIdx() < 0) return null;
    return `${this._listboxId}-opt-${this._focusIdx()}`;
  });

  protected optionId(idx: number): string {
    return `${this._listboxId}-opt-${idx}`;
  }

  private _onChange:  (v: string) => void = () => {};
  private _onTouched: () => void           = () => {};

  writeValue(v: string): void                     { this._value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void         { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void       { this._cvaDisabled.set(disabled); }

  protected onDocClick(e: MouseEvent): void {
    if (!this._el.nativeElement.contains(e.target as Node)) {
      this._open.set(false);
    }
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (this.disabled() || this._cvaDisabled()) return;

    const opts = this.options();

    if (!this._open()) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        this._focusIdx.update(i => {
          let next = i + 1;
          while (next < opts.length && (opts[next].disabled || opts[next].separator)) next++;
          return next < opts.length ? next : i;
        });
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        this._focusIdx.update(i => {
          let prev = i - 1;
          while (prev >= 0 && (opts[prev].disabled || opts[prev].separator)) prev--;
          return prev >= 0 ? prev : i;
        });
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const idx = this._focusIdx();
        if (idx >= 0 && idx < opts.length && !opts[idx].disabled && !opts[idx].separator) {
          this.selectOption(opts[idx].value);
        }
        break;
      }
      case 'Escape':
      case 'Tab': {
        this._open.set(false);
        break;
      }
    }
  }

  private _openDropdown(): void {
    this._open.set(true);
    const idx = this.options().findIndex(o => o.value === this._value());
    this._focusIdx.set(idx >= 0 ? idx : 0);
  }

  protected toggleOpen(): void {
    if (this.disabled() || this._cvaDisabled()) return;
    this._open() ? this._open.set(false) : this._openDropdown();
  }

  protected selectOption(value: string): void {
    this._value.set(value);
    this._onChange(value);
    this.valueChange.emit(value);
    this._open.set(false);
  }

  protected onBlur(): void { this._onTouched(); }
}
