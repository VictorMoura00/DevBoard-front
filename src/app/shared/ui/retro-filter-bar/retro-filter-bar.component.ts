import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface FilterTab {
  key: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-retro-filter-bar',
  standalone: true,
  templateUrl: './retro-filter-bar.component.html',
  styleUrl: './retro-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'tablist' },
})
export class RetroFilterBarComponent {
  readonly tabs        = input<FilterTab[]>([]);

  // Single-select (default)
  readonly active      = input<string>('');
  readonly tabChange   = output<string>();

  // Multi-select mode
  readonly multiSelect = input(false);
  readonly activeKeys  = input<string[]>([]);
  readonly keysChange  = output<string[]>();

  protected isActive(key: string): boolean {
    return this.multiSelect()
      ? this.activeKeys().includes(key)
      : this.active() === key;
  }

  protected select(key: string, disabled?: boolean): void {
    if (disabled) return;
    if (this.multiSelect()) {
      const keys = this.activeKeys();
      const next = keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key];
      this.keysChange.emit(next);
    } else {
      this.tabChange.emit(key);
    }
  }
}
