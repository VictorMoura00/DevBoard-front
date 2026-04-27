import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RetroInputComponent } from '../retro-input/retro-input.component';

@Component({
  selector: 'app-toolbar-search',
  standalone: true,
  imports: [RetroInputComponent],
  templateUrl: './toolbar-search.component.html',
  styleUrl: './toolbar-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarSearchComponent {
  readonly value       = input('');
  readonly placeholder = input('search...');
  readonly valueChange = output<string>();
  readonly cleared     = output<void>();
}
