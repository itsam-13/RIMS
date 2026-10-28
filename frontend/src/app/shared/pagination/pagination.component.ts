import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="pagination-bar" *ngIf="total > 0" aria-label="Pagination">
      <div class="pagination-info">
        Showing <strong>{{ startIndex }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ total }}</strong> records
      </div>

      <div class="pagination-controls" *ngIf="totalPages > 1">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          [disabled]="page <= 1"
          (click)="goToPage(page - 1)"
          aria-label="Previous page"
        >
          <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
          <span>Previous</span>
        </button>

        <div class="page-numbers">
          <button
            *ngFor="let p of pages"
            type="button"
            class="page-btn"
            [class.active]="p === page"
            (click)="goToPage(p)"
            [attr.aria-current]="p === page ? 'page' : null"
          >
            {{ p }}
          </button>
        </div>

        <button
          type="button"
          class="btn btn-secondary btn-sm"
          [disabled]="page >= totalPages"
          (click)="goToPage(page + 1)"
          aria-label="Next page"
        >
          <span>Next</span>
          <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      margin-top: 1rem;
      border-top: 1px solid var(--border-color, #235347);
      flex-wrap: wrap;
    }

    .pagination-info {
      font-size: 0.82rem;
      color: var(--text-secondary, #8eb69b);
    }

    .pagination-info strong {
      color: var(--text-primary, #daf1de);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .page-numbers {
      display: flex;
      gap: 0.25rem;
    }

    .page-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 0.5rem;
      display: grid;
      place-items: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm, 6px);
      color: var(--text-secondary, #8eb69b);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(.active) {
      background: var(--bg-card-hover, rgba(35, 83, 71, 0.4));
      color: var(--text-primary, #daf1de);
    }

    .page-btn.active {
      background: var(--accent-forest, #235347);
      color: var(--text-primary, #daf1de);
      border-color: var(--border-color, #235347);
      font-weight: 600;
    }
  `]
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() total = 0;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get startIndex(): number {
    if (this.total === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.page;
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }

    const list: number[] = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.page) {
      this.pageChange.emit(p);
    }
  }
}
