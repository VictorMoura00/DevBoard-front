import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-retro-range',
  standalone: true,
  templateUrl: './retro-range.component.html',
  styleUrl: './retro-range.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-full-width]': 'fullWidth()',
  },
})
export class RetroRangeComponent {
  readonly value = input(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly disabled = input(false);
  readonly fullWidth = input(false);

  readonly valueChange = output<number>();

  protected onInput(event: Event): void {
    this.valueChange.emit(Number((event.target as HTMLInputElement).value));
  }
}
