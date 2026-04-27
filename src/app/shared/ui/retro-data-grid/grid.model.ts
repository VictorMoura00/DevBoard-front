export type GridRowSize = 'sm' | 'md' | 'lg';

export interface GridColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[];
  noResize?: boolean;   // prevent resize on this column even when grid resizable=true
  minWidth?: number;    // px floor during resize (default 40)
}

export type SortDir = 'asc' | 'desc' | null;

export interface SortState {
  field: string;
  dir: SortDir;
}

// ── Advanced filter rules ─────────────────────────────────────────────────────

export type FilterOp =
  | 'contains' | 'eq' | 'neq'
  | 'starts'   | 'ends'
  | 'empty'    | 'notempty';

export interface FilterRule {
  id: string;
  field: string;
  op: FilterOp;
  value: string;
}
