import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type RetroCheckboxSize = 'sm' | 'md';

@Component({
  selector: 'app-retro-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-checkbox.component.html',
  styleUrl: './retro-checkbox.component.scss',
})
export class RetroCheckboxComponent {
  readonly checked       = input(false);
  readonly label         = input('');
  readonly size          = input<RetroCheckboxSize>('md');
  readonly disabled      = input(false);
  readonly readonly      = input(false);
  readonly invalid       = input(false);
  readonly indeterminate = input(false);
  /**
   * Value emitted when the checkbox is checked.
   * Useful for tri-state or custom value scenarios.
   */
  readonly trueValue     = input<unknown>(true);
  /** Value emitted when the checkbox is unchecked. */
  readonly falseValue    = input<unknown>(false);

  readonly checkedChange = output<boolean>();
  /** Emits trueValue / falseValue instead of plain boolean. */
  readonly valueChange   = output<unknown>();

  protected onChange(event: Event): void {
    if (this.readonly() || this.disabled()) return;
    const isChecked = (event.target as HTMLInputElement).checked;
    this.checkedChange.emit(isChecked);
    this.valueChange.emit(isChecked ? this.trueValue() : this.falseValue());
  }
}
