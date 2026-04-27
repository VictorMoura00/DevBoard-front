export type NotifType   = 'event' | 'build' | 'alert';
export type NotifSource = 'webhook' | 'email' | 'system';

export interface NotifItem {
  id:        string;
  type:      NotifType;
  source:    NotifSource;
  timestamp: Date;
  title:     string;
  subtitle?: string;
  read:      boolean;
}
