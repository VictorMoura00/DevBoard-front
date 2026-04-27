import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-retro-paginator',
  standalone: true,
  templateUrl: './retro-paginator.component.html',
  styleUrl: './retro-paginator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--pag-font-size]':   "size() === 'md' ? '11px' : null",
    '[style.--pag-btn-height]':  "size() === 'md' ? '24px' : null",
    '[style.--pag-btn-min-w]':   "size() === 'md' ? '26px' : null",
    '[style.--pag-padding]':     "size() === 'md' ? '6px 10px' : null",
  },
})
export class RetroPaginatorComponent {
  readonly page            = input(0);
  readonly pageSize        = input(10);
  readonly total           = input(0);
  readonly pageSizeOptions = input([5, 10, 25, 50]);
  readonly showPageSize    = input(true);
  readonly size            = input<'sm' | 'md'>('sm');

  readonly pageChange     = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly startRow = computed(() =>
    this.total() === 0 ? 0 : this.page() * this.pageSize() + 1,
  );

  protected readonly endRow = computed(() =>
    Math.min((this.page() + 1) * this.pageSize(), this.total()),
  );

  /** Builds a smart page-number window with ellipsis (null) where needed. */
  protected readonly pageNumbers = computed<(number | null)[]>(() => {
    const count = this.pageCount();
    const curr  = this.page();

    if (count <= 7) {
      return Array.from({ length: count }, (_, i) => i);
    }

    const pages: (number | null)[] = [0];
    if (curr > 3) pages.push(null);

    const lo = Math.max(1, curr - 1);
    const hi = Math.min(count - 2, curr + 1);
    for (let i = lo; i <= hi; i++) pages.push(i);

    if (curr < count - 4) pages.push(null);
    pages.push(count - 1);

    return pages;
  });

  protected goto(p: number): void {
    if (p >= 0 && p < this.pageCount()) {
      this.pageChange.emit(p);
    }
  }
}
