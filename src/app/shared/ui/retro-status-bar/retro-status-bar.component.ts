import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RetroKbdComponent } from '../retro-kbd/retro-kbd.component';

export interface StatusItem {
  label: string;
  value?: string | number;
}

export interface StatusShortcut {
  key: string;
  label: string;
}

@Component({
  selector: 'app-retro-status-bar',
  standalone: true,
  imports: [RetroKbdComponent],
  templateUrl: './retro-status-bar.component.html',
  styleUrl: './retro-status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-label': 'status bar' },
})
export class RetroStatusBarComponent {
  readonly version   = input('');
  readonly items     = input<StatusItem[]>([]);
  readonly shortcuts = input<StatusShortcut[]>([]);
}
