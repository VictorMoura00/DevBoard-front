export type ToastType     = 'event' | 'success' | 'warning' | 'error';
export type ToastPosition =
  | 'bottom-right' | 'bottom-left'
  | 'top-right'    | 'top-left'
  | 'top-center'   | 'bottom-center';

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
  /** Auto-dismiss duration in ms. Undefined = sticky (no auto-dismiss). */
  life?: number;
  sticky?: boolean;
}
