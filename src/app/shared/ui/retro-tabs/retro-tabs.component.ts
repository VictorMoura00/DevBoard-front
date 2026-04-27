import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import { WindowVariant } from '../retro-window/window.model';

export interface RetroTab {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly badge?: string | number;
  readonly disabled?: boolean;
}

export type { WindowVariant as TabVariant };

@Component({
  selector: 'app-retro-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-tabs.component.html',
  styleUrl: './retro-tabs.component.scss',
})
export class RetroTabsComponent {
  readonly tabs    = input<RetroTab[]>([]);
  readonly active  = model('');
  readonly variant = input<WindowVariant>('default');

  private readonly barRef = viewChild<ElementRef<HTMLElement>>('bar');

  protected activate(tab: RetroTab): void {
    if (!tab.disabled) this.active.set(tab.id);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const enabled = this.tabs().filter(t => !t.disabled);
    if (!enabled.length) return;

    const currentIdx = enabled.findIndex(t => t.id === this.active());
    let next = currentIdx;

    switch (event.key) {
      case 'ArrowRight': next = (currentIdx + 1) % enabled.length; break;
      case 'ArrowLeft':  next = (currentIdx - 1 + enabled.length) % enabled.length; break;
      case 'Home':       next = 0; break;
      case 'End':        next = enabled.length - 1; break;
      default: return;
    }

    event.preventDefault();
    this.active.set(enabled[next].id);

    const btns = this.barRef()?.nativeElement.querySelectorAll<HTMLButtonElement>('.retro-tab:not([disabled])');
    btns?.[next]?.focus();
  }
}
