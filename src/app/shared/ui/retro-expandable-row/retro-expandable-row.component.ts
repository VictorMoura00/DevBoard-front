import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-retro-expandable-row',
  standalone: true,
  templateUrl: './retro-expandable-row.component.html',
  styleUrl: './retro-expandable-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'row',
    '[class.is-expanded]': 'expanded()',
  },
})
export class RetroExpandableRowComponent {
  /** Two-way bindable — works both controlled and uncontrolled. */
  expanded = model(false);

  /** When true the entire .row-main div is clickable and toggles expansion. */
  expandOnClick = input(false);

  /** Call from a toggle button inside the projected content to flip state. */
  toggle(): void { this.expanded.update(v => !v); }

  protected handleRowClick(): void {
    if (this.expandOnClick()) this.toggle();
  }
}
