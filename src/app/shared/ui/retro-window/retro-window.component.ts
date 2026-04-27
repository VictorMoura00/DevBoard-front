import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';

import { WindowControl, WindowPadding, WindowStatus, WindowVariant } from './window.model';

@Component({
  selector: 'app-retro-window',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './retro-window.component.html',
  styleUrl: './retro-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-expanded]':   'expanded()',
    '[class.is-closed]':     'closed()',
    '[class.is-collapsed]':  'collapsed()',
  },
})
export class RetroWindowComponent {
  // ── Identity ──────────────────────────────────────────────────────────────
  readonly title    = input.required<string>();
  readonly subtitle = input('');

  // ── Appearance ────────────────────────────────────────────────────────────
  /** Visual theme of the titlebar. @default 'default' */
  readonly variant = input<WindowVariant>('default');

  /** Inner body padding preset. @default 'md' */
  readonly padding = input<WindowPadding>('md');

  // ── Status indicator ──────────────────────────────────────────────────────
  /** Shows a colored dot + label in the titlebar. null = hidden. */
  readonly status = input<WindowStatus | null>(null);

  /** Overrides the auto status label (e.g. 'SYNCING' instead of 'LOADING'). */
  readonly statusLabel = input('');

  // ── Body behaviour ────────────────────────────────────────────────────────
  readonly scrollable = input(false);

  /** Max-height (px) when scrollable is true. @default 340 */
  readonly maxHeight = input(340);

  // ── Loading bar ───────────────────────────────────────────────────────────
  /**
   * Shows an animated progress bar below the titlebar.
   * Activates automatically when status === 'loading'.
   */
  readonly loading = input(false);

  // ── Window controls ───────────────────────────────────────────────────────
  /**
   * Shortcut to show all three control buttons.
   * Equivalent to [controls]="['minimize','maximize','close']".
   */
  readonly showControls = input(false);

  /**
   * Granular control over which buttons are visible.
   * Takes precedence over showControls when provided.
   */
  readonly controls = input<WindowControl[]>([]);

  // ── Closeable state (two-way bindable) ────────────────────────────────────
  /** Hides the window. Bind with [(closed)] or [closed] + (closedChange). */
  readonly closed = model(false);

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly minimizeClick = output<void>();
  readonly maximizeClick = output<void>();
  readonly closeClick    = output<void>();

  /** Shows a small character/icon before the titlebar mark. E.g. '▶', '⚙', '⚠' */
  readonly icon = input('');

  // ── Internal state ────────────────────────────────────────────────────────
  /** Minimized state — two-way bindable via [(collapsed)]. */
  readonly collapsed = model(false);
  protected readonly expanded  = signal(false);

  // ── Derived: effective control set ───────────────────────────────────────
  protected readonly effectiveControls = computed<Set<WindowControl>>(() => {
    const explicit = this.controls();
    if (explicit.length > 0) return new Set(explicit);
    if (this.showControls()) return new Set<WindowControl>(['minimize', 'maximize', 'close']);
    return new Set<WindowControl>();
  });

  protected readonly hasMinimize = computed(() => this.effectiveControls().has('minimize'));
  protected readonly hasMaximize = computed(() => this.effectiveControls().has('maximize'));
  protected readonly hasClose    = computed(() => this.effectiveControls().has('close'));
  protected readonly hasAnyControl = computed(() => this.effectiveControls().size > 0);

  // ── Derived: auto loading bar ─────────────────────────────────────────────
  protected readonly showLoader = computed(() => this.loading() || this.status() === 'loading');

  // ── Derived: status label ─────────────────────────────────────────────────
  protected readonly resolvedStatusLabel = computed(() => {
    if (this.statusLabel()) return this.statusLabel();
    const map: Record<NonNullable<WindowStatus>, string> = {
      idle:    'IDLE',
      active:  'ACTIVE',
      loading: 'LOADING',
      error:   'ERROR',
    };
    const s = this.status();
    return s ? map[s] : '';
  });

  // ── Derived: body inline styles ───────────────────────────────────────────
  protected readonly bodyStyles = computed(() => {
    const styles: Record<string, string> = {};
    if (this.scrollable()) styles['max-height'] = `${this.maxHeight()}px`;
    return styles;
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  protected onMinimize(): void {
    this.collapsed.update(v => !v);
    this.minimizeClick.emit();
  }

  protected onMaximize(): void {
    this.expanded.update(v => !v);
    if (!this.expanded()) this.collapsed.set(false);
    this.maximizeClick.emit();
  }

  protected onClose(): void {
    this.closed.set(true);
    this.closeClick.emit();
  }
}
