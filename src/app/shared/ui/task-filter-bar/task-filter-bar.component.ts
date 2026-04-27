import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FilterTab } from '../retro-filter-bar/retro-filter-bar.component';

@Component({
  selector: 'app-task-filter-bar',
  standalone: true,
  templateUrl: './task-filter-bar.component.html',
  styleUrl: './task-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'tablist' },
})
export class TaskFilterBarComponent {
  readonly tabs       = input<FilterTab[]>([]);
  readonly active     = input<string>('');
  readonly tabChange  = output<string>();
}
