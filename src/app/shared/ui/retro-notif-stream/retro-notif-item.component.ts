import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { NotifSource, NotifType } from './notif.model';
import { RelativeTimePipe } from './relative-time.pipe';

@Component({
  selector: 'app-retro-notif-item',
  standalone: true,
  imports: [RelativeTimePipe],
  templateUrl: './retro-notif-item.component.html',
  styleUrl: './retro-notif-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role':            'listitem',
    '[class.is-read]': 'read()',
  },
})
export class RetroNotifItemComponent {
  readonly type      = input.required<NotifType>();
  readonly source    = input.required<NotifSource>();
  readonly timestamp = input.required<Date>();
  readonly title     = input.required<string>();
  readonly subtitle  = input<string | undefined>(undefined);
  readonly read      = input(false);

  readonly itemRead = output<void>();

  private static readonly BADGE_LABELS: Record<NotifType, string> = {
    event: 'EVENT',
    build: 'BUILD',
    alert: 'ALERT',
  };

  protected badgeLabel(): string { return RetroNotifItemComponent.BADGE_LABELS[this.type()]; }
}
