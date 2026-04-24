export type ToastType     = 'event' | 'success' | 'warning' | 'error';
export type ToastPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface ToastDetails {
  code?: string;
  service?: string;
  http?: string;
  trace?: string;
  stack?: string;
  action?: { label: string; url: string };
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  details?: ToastDetails;
}
