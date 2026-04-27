import { computed, signal } from '@angular/core';

import { FilterOp, FilterRule, SortState } from './grid.model';

export interface RetroTableConfig<T extends Record<string, any>> {
  rows: () => T[];
  searchFields?: (keyof T & string)[];
  filterFields?: (keyof T & string)[];
  pageSize?: number;
  pageSizeOptions?: number[];
}

function matchRule(rawVal: unknown, op: FilterOp, value: string): boolean {
  const v = String(rawVal ?? '').toLowerCase();
  const q = value.toLowerCase();
  switch (op) {
    case 'contains':  return v.includes(q);
    case 'eq':        return v === q;
    case 'neq':       return v !== q;
    case 'starts':    return v.startsWith(q);
    case 'ends':      return v.endsWith(q);
    case 'empty':     return v === '';
    case 'notempty':  return v !== '';
  }
}

export function createRetroTable<T extends Record<string, any>>(config: RetroTableConfig<T>) {
  const _pageSize     = signal(config.pageSize ?? 10);
  const searchQuery   = signal('');
  const sortState     = signal<SortState>({ field: '', dir: null });
  const columnFilters = signal<Record<string, string[]>>({});
  const filterRules   = signal<FilterRule[]>([]);
  const page          = signal(0);
  const expandedIds   = signal<Set<string>>(new Set());
  const hiddenCols    = signal<Set<string>>(new Set());
  const colWidths     = signal<Record<string, number>>({});

  // ── Data pipeline ──────────────────────────────────────────────────────────

  const filtered = computed(() => {
    let data = config.rows();

    // Global search
    const q = searchQuery().toLowerCase().trim();
    if (q && config.searchFields?.length) {
      data = data.filter(row =>
        config.searchFields!.some(f => String(row[f] ?? '').toLowerCase().includes(q)),
      );
    }

    // Column checkbox-filters
    const colFilters = columnFilters();
    for (const [field, values] of Object.entries(colFilters)) {
      if (values.length) {
        data = data.filter(row => values.includes(String(row[field] ?? '')));
      }
    }

    // Advanced filter rules
    for (const rule of filterRules()) {
      if (!rule.field) continue;
      // Skip rules where value is empty and op needs a value
      if (rule.op !== 'empty' && rule.op !== 'notempty' && rule.value === '') continue;
      data = data.filter(row => matchRule(row[rule.field], rule.op, rule.value));
    }

    return data;
  });

  const sorted = computed(() => {
    const { field, dir } = sortState();
    if (!field || !dir) return filtered();
    return [...filtered()].sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  const totalCount = computed(() => filtered().length);
  const pageCount  = computed(() => Math.max(1, Math.ceil(totalCount() / _pageSize())));

  const visibleRows = computed(() => {
    const start = page() * _pageSize();
    return sorted().slice(start, start + _pageSize());
  });

  // Unique values from the full (unfiltered) dataset
  const filterOptionsMap = computed<Record<string, string[]>>(() => {
    if (!config.filterFields?.length) return {};
    const all = config.rows();
    const map: Record<string, string[]> = {};
    for (const field of config.filterFields) {
      const vals = new Set<string>();
      for (const row of all) {
        const v = row[field];
        if (v != null) vals.add(String(v));
      }
      map[field] = [...vals].sort();
    }
    return map;
  });

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // State signals (read)
    searchQuery,
    sortState,
    columnFilters,
    filterRules,
    page,
    pageSize: _pageSize,
    expandedIds,
    hiddenCols,
    colWidths,

    // Derived (read)
    visibleRows,
    filteredRows: sorted,
    totalCount,
    pageCount,
    filterOptionsMap,
    pageSizeOptions: config.pageSizeOptions ?? [5, 10, 25, 50],

    // ── Search / sort / column filters ──────────────────────────────────────

    setSearch(q: string): void {
      searchQuery.set(q);
      page.set(0);
    },

    toggleSort(field: string): void {
      const s = sortState();
      if (s.field !== field) {
        sortState.set({ field, dir: 'asc' });
      } else if (s.dir === 'asc') {
        sortState.set({ field, dir: 'desc' });
      } else {
        sortState.set({ field: '', dir: null });
      }
      page.set(0);
    },

    setColumnFilter(field: string, values: string[]): void {
      columnFilters.update(f => ({ ...f, [field]: values }));
      page.set(0);
    },

    clearColumnFilter(field: string): void {
      columnFilters.update(f => { const n = { ...f }; delete n[field]; return n; });
      page.set(0);
    },

    clearAllFilters(): void {
      columnFilters.set({});
      searchQuery.set('');
      filterRules.set([]);
      page.set(0);
    },

    // ── Filter rules ─────────────────────────────────────────────────────────

    addFilterRule(): void {
      const id = `r${Date.now()}`;
      filterRules.update(r => [...r, { id, field: '', op: 'contains', value: '' }]);
    },

    removeFilterRule(id: string): void {
      filterRules.update(r => r.filter(x => x.id !== id));
      page.set(0);
    },

    updateFilterRule(id: string, patch: Partial<Omit<FilterRule, 'id'>>): void {
      filterRules.update(r => r.map(x => x.id === id ? { ...x, ...patch } : x));
      page.set(0);
    },

    clearFilterRules(): void {
      filterRules.set([]);
      page.set(0);
    },

    // ── Pagination ───────────────────────────────────────────────────────────

    setPage(p: number): void { page.set(p); },

    setPageSize(s: number): void { _pageSize.set(s); page.set(0); },

    // ── Row expansion ────────────────────────────────────────────────────────

    isExpanded(id: string): boolean { return expandedIds().has(id); },

    setExpanded(id: string, v: boolean): void {
      expandedIds.update(set => {
        const next = new Set(set);
        v ? next.add(id) : next.delete(id);
        return next;
      });
    },

    toggleExpand(id: string): void {
      expandedIds.update(set => {
        const next = new Set(set);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },

    collapseAll(): void { expandedIds.set(new Set()); },

    // ── Column visibility ────────────────────────────────────────────────────

    toggleColVisibility(key: string): void {
      hiddenCols.update(s => {
        const next = new Set(s);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
    },

    showAllCols(): void { hiddenCols.set(new Set()); },

    // ── Column widths ────────────────────────────────────────────────────────

    setColWidth(key: string, width: number): void {
      colWidths.update(w => ({ ...w, [key]: width }));
    },

    resetColWidths(): void { colWidths.set({}); },
  };
}

export type RetroTable<T extends Record<string, any>> = ReturnType<typeof createRetroTable<T>>;
