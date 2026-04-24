import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-retro-window',
  standalone: true,
  templateUrl: './retro-window.component.html',
  styleUrl: './retro-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroWindowComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly showControls = input(false);
  readonly noPadding = input(false);
  readonly scrollable = input(false);
}
