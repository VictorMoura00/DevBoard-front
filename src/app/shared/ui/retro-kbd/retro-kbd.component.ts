import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-retro-kbd',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retro-kbd.component.html',
  styleUrl: './retro-kbd.component.scss',
})
export class RetroKbdComponent {
  /** Pass multiple keys for a combo: keys="['⌘','K']" renders ⌘ + K */
  readonly keys = input<string[]>([]);
}
