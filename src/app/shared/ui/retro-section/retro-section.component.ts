import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { WindowVariant } from '../retro-window/window.model';

export type SectionVariant = WindowVariant;

@Component({
  selector: 'app-retro-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-section.component.html',
  styleUrl: './retro-section.component.scss',
})
export class RetroSectionComponent {
  /** Label shown in the top-left corner of the border. */
  readonly label   = input('');
  readonly variant = input<SectionVariant>('default');
}
