import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { GridRowSize } from '../retro-data-grid/grid.model';
export type { GridRowSize };

@Component({
  selector: 'app-retro-grid-row',
  standalone: true,
  template: `<ng-content />`,
  styleUrl: './retro-grid-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'row',
    '[style.--row-font-size]':    "size() === 'sm' ? '9px'  : size() === 'lg' ? '12px' : null",
    '[style.--row-cell-padding]': "size() === 'sm' ? '3px 6px' : size() === 'lg' ? '8px 10px' : null",
  },
})
export class RetroGridRowComponent {
  /** Row density. Overrides the grid-level `rowSize` for this row only. */
  readonly size = input<GridRowSize>('md');
}
