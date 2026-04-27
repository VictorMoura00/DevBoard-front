import { Injectable, computed, signal } from '@angular/core';

import { NotifItem, NotifSource, NotifType } from './notif.model';

@Injectable({ providedIn: 'root' })
export class NotifService {
  readonly items       = signal<NotifItem[]>([]);
  readonly unreadCount = computed(() => this.items().filter(i => !i.read).length);
  readonly totalCount  = computed(() => this.items().length);

  add(payload: { type: NotifType; source: NotifSource; title: string; subtitle?: string }): void {
    const item: NotifItem = {
      ...payload,
      id:        crypto.randomUUID(),
      read:      false,
      timestamp: new Date(),
    };
    this.items.update(prev => [item, ...prev]);
  }

  markRead(id: string): void {
    this.items.update(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  }

  markAllRead(): void {
    this.items.update(prev => prev.map(i => ({ ...i, read: true })));
  }

  clear(): void {
    this.items.set([]);
  }
}
