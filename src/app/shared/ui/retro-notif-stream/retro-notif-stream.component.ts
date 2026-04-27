import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { NotifService } from './notif.service';

@Component({
  selector: 'app-retro-notif-stream',
  standalone: true,
  templateUrl: './retro-notif-stream.component.html',
  styleUrl: './retro-notif-stream.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role':               'complementary',
    '[class.is-open]':    'open()',
    '[attr.aria-hidden]': '!open()',
    '[attr.aria-label]':  '"Notification stream"',
  },
})
export class RetroNotifStreamComponent {
  protected readonly service = inject(NotifService);

  readonly open = input(false);

  readonly closed = output<void>();

  protected readonly headerLabel = computed(() =>
    `NOTIFICATIONS.STREAM — ${this.service.totalCount()} ITEMS`,
  );
}
