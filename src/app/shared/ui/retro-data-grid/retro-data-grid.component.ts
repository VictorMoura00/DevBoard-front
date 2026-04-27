import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { FilterOp, FilterRule, GridColumn, GridRowSize, SortState } from './grid.model';

@Component({
  selector: 'app-retro-data-grid',
  standalone: true,
  templateUrl: './retro-data-grid.component.html',
  styleUrl: './retro-data-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroDataGridComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  // ── Base ─────────────────────────────────────────────────────────────────
  readonly title        = input.required<string>();
  readonly subtitle     = input('');
  readonly columns      = input<GridColumn[]>([]);
  readonly rowCount     = input<number | null>(null);
  readonly emptyMessage = input('sem registros');
  readonly addLabel     = input<string | null>(null);
  readonly rowSize      = input<GridRowSize>('md');
  readonly addClick     = output<void>();

  // ── Feature flags ─────────────────────────────────────────────────────────
  readonly resizable          = input(false);   // enable column drag-resize
  readonly columnPicker       = input(false);   // enable column visibility toggle UI
  readonly filterRulesEnabled = input(false);   // enable advanced filter rules UI

  // ── Sort ─────────────────────────────────────────────────────────────────
  readonly sortState  = input<SortState>({ field: '', dir: null });
  readonly sortChange = output<string>();

  // ── Global search ─────────────────────────────────────────────────────────
  readonly searchable        = input(false);
  readonly searchPlaceholder = input('search...');
  readonly searchQuery       = input('');
  readonly searchChange      = output<string>();

  // ── Column checkbox-filters ───────────────────────────────────────────────
  readonly columnFilters      = input<Record<string, string[]>>({});
  readonly filterOptionsMap   = input<Record<string, string[]>>({});
  readonly columnFilterChange = output<{ field: string; values: string[] }>();

  // ── Advanced filter rules ─────────────────────────────────────────────────
  readonly filterRules     = input<FilterRule[]>([]);
  readonly filterRuleAdd   = output<void>();
  readonly filterRuleRemove = output<string>();
  readonly filterRuleUpdate = output<{ id: string } & Partial<FilterRule>>();
  readonly filterRuleClear  = output<void>();

  // ── Column visibility ─────────────────────────────────────────────────────
  readonly hiddenCols           = input<Set<string>>(new Set());
  readonly colVisibilityToggle  = output<string>();
  readonly colVisibilityShowAll = output<void>();

  // ── Column resize ─────────────────────────────────────────────────────────
  readonly colWidths     = input<Record<string, number>>({});
  readonly colWidthChange = output<{ key: string; width: number }>();

  // ── Internal ──────────────────────────────────────────────────────────────
  protected readonly activeFilterCol  = signal<string | null>(null);
  protected readonly showColPicker    = signal(false);
  protected readonly showRulesPanel   = signal(false);
  protected readonly isResizing       = signal(false);

  private resizingKey    = '';
  private resizingStartX = 0;
  private resizingStartW = 0;
  private readonly localColWidths = signal<Record<string, number>>({});

  protected readonly visibleCols = computed(() =>
    this.columns().filter(c => !c.hidden && !this.hiddenCols().has(c.key)),
  );

  protected readonly filterableCols = computed(() =>
    this.columns().filter(c => c.label && !this.hiddenCols().has(c.key)),
  );

  protected readonly colTemplate = computed(() => {
    const persisted = this.colWidths();
    const local     = this.localColWidths();
    const merged    = { ...persisted, ...local };
    return this.visibleCols().map(c => {
      if (merged[c.key] != null) return `${merged[c.key]}px`;
      return c.width ?? 'auto';
    }).join(' ');
  });

  protected readonly isEmpty = computed(() =>
    this.rowCount() !== null && this.rowCount() === 0,
  );

  protected readonly activeRulesCount = computed(() =>
    this.filterRules().filter(r => r.field && (r.op === 'empty' || r.op === 'notempty' || r.value !== '')).length,
  );

  protected readonly filterOps: { value: FilterOp; label: string }[] = [
    { value: 'contains',  label: 'contains'  },
    { value: 'eq',        label: 'equals'    },
    { value: 'neq',       label: '≠ not eq'  },
    { value: 'starts',    label: 'starts'    },
    { value: 'ends',      label: 'ends'      },
    { value: 'empty',     label: 'is empty'  },
    { value: 'notempty',  label: 'not empty' },
  ];

  // ── Sort helpers ─────────────────────────────────────────────────────────

  protected sortIcon(field: string): string {
    const s = this.sortState();
    if (s.field !== field || s.dir === null) return '↕';
    return s.dir === 'asc' ? '↑' : '↓';
  }

  protected isSorted(field: string): boolean {
    const s = this.sortState();
    return s.field === field && s.dir !== null;
  }

  // ── Column checkbox-filter helpers ────────────────────────────────────────

  protected filterOptionsFor(col: GridColumn): string[] {
    return this.filterOptionsMap()[col.key] ?? col.filterOptions ?? [];
  }

  protected isFiltered(field: string): boolean {
    return (this.columnFilters()[field]?.length ?? 0) > 0;
  }

  protected isOptSelected(field: string, opt: string): boolean {
    return (this.columnFilters()[field] ?? []).includes(opt);
  }

  protected toggleFilterCol(field: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeFilterCol.update(v => v === field ? null : field);
    this.showColPicker.set(false);
  }

  protected toggleOpt(field: string, opt: string): void {
    const current = this.columnFilters()[field] ?? [];
    const next = current.includes(opt)
      ? current.filter(v => v !== opt)
      : [...current, opt];
    this.columnFilterChange.emit({ field, values: next });
  }

  protected clearFilter(field: string): void {
    this.columnFilterChange.emit({ field, values: [] });
    this.activeFilterCol.set(null);
  }

  // ── Column picker ─────────────────────────────────────────────────────────

  protected toggleColPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.showColPicker.update(v => !v);
    this.activeFilterCol.set(null);
  }

  // ── Filter rules panel ────────────────────────────────────────────────────

  protected toggleRulesPanel(event: MouseEvent): void {
    event.stopPropagation();
    this.showRulesPanel.update(v => !v);
  }

  protected ruleNeedsValue(op: FilterOp): boolean {
    return op !== 'empty' && op !== 'notempty';
  }

  // ── Column resize ─────────────────────────────────────────────────────────

  protected startResize(key: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingKey    = key;
    this.resizingStartX = event.clientX;
    const th = (event.target as HTMLElement).closest('.grid__th') as HTMLElement | null;
    this.resizingStartW = th ? th.getBoundingClientRect().width : 100;
    this.isResizing.set(true);
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  protected onMouseMove(event: MouseEvent): void {
    if (!this.resizingKey) return;
    const col = this.columns().find(c => c.key === this.resizingKey);
    const min = col?.minWidth ?? 40;
    const delta = event.clientX - this.resizingStartX;
    const w = Math.max(min, this.resizingStartW + delta);
    this.localColWidths.update(lw => ({ ...lw, [this.resizingKey]: w }));
  }

  @HostListener('document:mouseup')
  protected onMouseUp(): void {
    if (!this.resizingKey) return;
    const width = this.localColWidths()[this.resizingKey];
    if (width != null) {
      this.colWidthChange.emit({ key: this.resizingKey, width });
      this.localColWidths.update(lw => { const n = { ...lw }; delete n[this.resizingKey]; return n; });
    }
    this.resizingKey = '';
    this.isResizing.set(false);
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
  }

  // ── Global click — close popovers ─────────────────────────────────────────

  @HostListener('document:click', ['$event.target'])
  protected onDocumentClick(target: EventTarget | null): void {
    if (this.el.nativeElement.contains(target as Node)) return;
    this.activeFilterCol.set(null);
    this.showColPicker.set(false);
  }
}
