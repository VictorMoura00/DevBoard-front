import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface RetroSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-retro-select',
  standalone: true,
  templateUrl: './retro-select.component.html',
  styleUrl: './retro-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-full-width]': 'fullWidth()',
  },
})
export class RetroSelectComponent {
  readonly value = input('');
  readonly options = input<RetroSelectOption[]>([]);
  readonly size = input<'sm' | 'md'>('md');
  readonly disabled = input(false);
  readonly fullWidth = input(false);

  readonly valueChange = output<string>();

  protected onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
