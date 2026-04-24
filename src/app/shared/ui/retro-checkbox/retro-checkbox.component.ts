import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-retro-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-checkbox.component.html',
  styleUrl: './retro-checkbox.component.scss',
})
export class RetroCheckboxComponent {
  readonly checked = input(false);
  readonly label = input('');
  readonly disabled = input(false);
  readonly indeterminate = input(false);

  readonly checkedChange = output<boolean>();

  protected onChange(event: Event): void {
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}
