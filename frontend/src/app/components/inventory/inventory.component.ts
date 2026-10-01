import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Inventory, Product, Warehouse, Category } from '../../models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      <!-- Page Title & Actions -->
      <div class="page-header">
        <div>
          <div class="technical-label">REAL-TIME INVENTORY LEDGER</div>
          <h1 class="page-title">Stock Matrix & Physical Audit</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadData()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openInitModal()">
            <i class="ri-add-line"></i>
            <span>INITIALIZE NEW STOCK ROW</span>
          </button>
        </div>
      </div>

      <!-- Filter Command Bar -->
      <div class="filter-panel panel">
        <div class="filter-grid">
          <!-- Search SKU or Product -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">SEARCH PRODUCT / SKU</label>
            <div class="search-input-box">
              <i class="ri-search-line"></i>
              <input
                type="text"
                class="form-control input-mono"
                [(ngModel)]="searchQuery"
                placeholder="Search by SKU or item name..."
              />
            </div>
          </div>

          <!-- Warehouse Filter -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">WAREHOUSE FACILITY</label>
            <select class="form-select" [(ngModel)]="selectedWarehouseId">
              <option [ngValue]="null">ALL WAREHOUSES ({{ warehouses().length }})</option>
              <option *ngFor="let w of warehouses()" [ngValue]="w.id">
                {{ w.name }} ({{ w.location }})
              </option>
            </select>
          </div>

          <!-- Category Filter -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">PRODUCT CATEGORY</label>
            <select class="form-select" [(ngModel)]="selectedCategoryId">
              <option [ngValue]="null">ALL CATEGORIES ({{ categories().length }})</option>
              <option *ngFor="let c of categories()" [ngValue]="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <!-- Low Stock Toggle -->
          <div class="toggle-container">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="onlyLowStock" />
              <span>SHOW CRITICAL & LOW STOCK ONLY</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Inventory Data Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>PRODUCT NAME</th>
              <th>CATEGORY</th>
              <th>WAREHOUSE</th>
              <th>CURRENT STOCK</th>
              <th>REORDER THRESHOLD</th>
              <th>STATUS</th>
              <th style="text-align: right;">OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredInventory().length === 0">
              <td colspan="9" class="empty-state">
                <i class="ri-inbox-line"></i>
                <div>No inventory records match current filter criteria.</div>
              </td>
            </tr>
            <tr *ngFor="let row of filteredInventory()">
              <td class="mono text-muted">#{{ row.id }}</td>
              <td class="mono font-bold" style="color: var(--accent-primary);">
                {{ row.product?.sku || 'SKU-NONE' }}
              </td>
              <td style="font-weight: 500;">{{ row.product?.name || 'Unknown Item' }}</td>
              <td>
                <span class="badge badge-neutral">
                  {{ row.product?.category?.name || 'Uncategorized' }}
                </span>
              </td>
              <td>
                <div style="font-weight: 500;">{{ row.warehouse?.name }}</div>
                <div class="text-muted" style="font-size: 0.72rem;">{{ row.warehouse?.location }}</div>
              </td>
              <td class="mono" style="font-size: 1rem; font-weight: 700;">
                {{ row.quantity }}
              </td>
              <td class="mono text-muted">
                {{ row.product?.reorderLevel ?? '—' }}
              </td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-danger': row.quantity <= 0,
                    'badge-warning': row.quantity > 0 && row.quantity <= (row.product?.reorderLevel || 0),
                    'badge-success': row.quantity > (row.product?.reorderLevel || 0)
                  }"
                >
                  <span class="badge-dot"></span>
                  {{
                    row.quantity <= 0
                      ? 'DEPLETED'
                      : row.quantity <= (row.product?.reorderLevel || 0)
                      ? 'LOW STOCK'
                      : 'NORMAL'
                  }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button
                    class="btn btn-secondary btn-sm"
                    (click)="openAdjustModal(row)"
                    title="Quick delta adjust (+/-)"
                  >
                    <i class="ri-swap-line"></i> DELTA
                  </button>
                  <button
                    class="btn btn-secondary btn-sm"
                    (click)="openAuditModal(row)"
                    title="Audit exact physical count"
                  >
                    <i class="ri-edit-line"></i> AUDIT
                  </button>
                  <button
                    *ngIf="authService.isAdmin()"
                    class="btn btn-danger btn-sm"
                    (click)="deleteRow(row)"
                    title="Delete inventory row (Admin only)"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL 1: INITIALIZE STOCK ROW -->
      <div class="modal-backdrop" *ngIf="showInitModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">INVENTORY INITIALIZATION</div>
              <div class="section-title">Bind Stock to Warehouse</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showInitModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">SELECT PRODUCT</label>
              <select class="form-select" [(ngModel)]="newStock.productId">
                <option [ngValue]="null" disabled>Choose product...</option>
                <option *ngFor="let p of products()" [ngValue]="p.id">
                  [{{ p.sku }}] {{ p.name }} (Threshold: {{ p.reorderLevel }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">TARGET WAREHOUSE</label>
              <select class="form-select" [(ngModel)]="newStock.warehouseId">
                <option [ngValue]="null" disabled>Choose warehouse...</option>
                <option *ngFor="let w of warehouses()" [ngValue]="w.id">
                  {{ w.name }} ({{ w.location }}) — Capacity: {{ w.capacity }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">INITIAL PHYSICAL STOCK COUNT</label>
              <input
                type="number"
                class="form-control input-mono"
                [(ngModel)]="newStock.quantity"
                min="0"
                placeholder="e.g. 100"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showInitModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="submitInitStock()"
              [disabled]="!newStock.productId || !newStock.warehouseId || newStock.quantity < 0"
            >
              INITIALIZE STOCK
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 2: DELTA ADJUSTMENT -->
      <div class="modal-backdrop" *ngIf="showAdjustModal && activeRow">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">DELTA STOCK ADJUSTMENT</div>
              <div class="section-title">Modify Quantity by Delta</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showAdjustModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="info-callout">
              <div><strong>Item:</strong> {{ activeRow.product?.name }} ({{ activeRow.product?.sku }})</div>
              <div><strong>Facility:</strong> {{ activeRow.warehouse?.name }}</div>
              <div><strong>Current Stock:</strong> <span class="mono">{{ activeRow.quantity }} units</span></div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">ADJUSTMENT DELTA (+ FOR ARRIVAL, - FOR REMOVAL)</label>
              <input
                type="number"
                class="form-control input-mono"
                [(ngModel)]="deltaValue"
                placeholder="e.g. 25 or -10"
              />
              <span class="text-muted" style="font-size: 0.72rem;">
                Resulting stock after adjustment:
                <strong class="mono" [style.color]="(activeRow.quantity + deltaValue) < 0 ? 'var(--color-danger)' : 'var(--color-success)'">
                  {{ activeRow.quantity + deltaValue }}
                </strong> units
              </span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showAdjustModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="submitDeltaAdjust()"
              [disabled]="deltaValue === 0 || (activeRow.quantity + deltaValue) < 0"
            >
              APPLY DELTA
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 3: EXACT PHYSICAL AUDIT -->
      <div class="modal-backdrop" *ngIf="showAuditModal && activeRow">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">PHYSICAL STOCK AUDIT</div>
              <div class="section-title">Overwrite Verified Count</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showAuditModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="info-callout">
              <div><strong>Item:</strong> {{ activeRow.product?.name }} ({{ activeRow.product?.sku }})</div>
              <div><strong>Facility:</strong> {{ activeRow.warehouse?.name }}</div>
              <div><strong>System Count:</strong> <span class="mono">{{ activeRow.quantity }} units</span></div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">AUDITED PHYSICAL COUNT</label>
              <input
                type="number"
                class="form-control input-mono"
                [(ngModel)]="exactAuditCount"
                min="0"
                placeholder="e.g. 150"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showAuditModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="submitExactAudit()"
              [disabled]="exactAuditCount < 0"
            >
              SAVE AUDITED COUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inventory-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 0.6rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1.5fr 1.2fr 1.2fr auto;
      gap: 1rem;
      align-items: flex-end;
    }

    @media (max-width: 900px) {
      .filter-grid {
        grid-template-columns: 1fr;
      }
    }

    .search-input-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input-box i {
      position: absolute;
      left: 0.75rem;
      color: var(--text-muted);
    }

    .search-input-box input {
      padding-left: 2.2rem;
    }

    .toggle-container {
      display: flex;
      align-items: center;
      padding-bottom: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-warning);
    }

    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
    }

    .info-callout {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      font-size: 0.82rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
  `]
})
export class InventoryComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  loading = signal<boolean>(false);
  inventoryList = signal<Inventory[]>([]);
  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);
  categories = signal<Category[]>([]);

  // Filter criteria
  searchQuery = '';
  selectedWarehouseId: number | null = null;
  selectedCategoryId: number | null = null;
  onlyLowStock = false;

  // Modals state
  showInitModal = false;
  newStock = {
    productId: null as number | null,
    warehouseId: null as number | null,
    quantity: 0
  };

  showAdjustModal = false;
  activeRow: Inventory | null = null;
  deltaValue = 0;

  showAuditModal = false;
  exactAuditCount = 0;

  filteredInventory = computed(() => {
    let list = this.inventoryList();

    if (this.selectedWarehouseId) {
      list = list.filter(i => (i.warehouse?.id === this.selectedWarehouseId) || (i.warehouseId === this.selectedWarehouseId));
    }

    if (this.selectedCategoryId) {
      list = list.filter(i => (i.product?.category?.id === this.selectedCategoryId) || (i.product?.categoryId === this.selectedCategoryId));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(i =>
        i.product?.name?.toLowerCase().includes(q) ||
        i.product?.sku?.toLowerCase().includes(q)
      );
    }

    if (this.onlyLowStock) {
      list = list.filter(i => (i.quantity <= (i.product?.reorderLevel || 0)));
    }

    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      inventory: this.api.getInventory(),
      products: this.api.getProducts(),
      warehouses: this.api.getWarehouses(),
      categories: this.api.getCategories()
    }).subscribe({
      next: (res) => {
        this.inventoryList.set(res.inventory || []);
        this.products.set(res.products || []);
        this.warehouses.set(res.warehouses || []);
        this.categories.set(res.categories || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to sync inventory matrix.', 'Matrix Error');
      }
    });
  }

  openInitModal() {
    this.newStock = {
      productId: this.products().length > 0 ? this.products()[0].id : null,
      warehouseId: this.warehouses().length > 0 ? this.warehouses()[0].id : null,
      quantity: 0
    };
    this.showInitModal = true;
  }

  submitInitStock() {
    if (!this.newStock.productId || !this.newStock.warehouseId) return;

    this.api.createInventory({
      productId: this.newStock.productId,
      warehouseId: this.newStock.warehouseId,
      quantity: this.newStock.quantity
    }).subscribe({
      next: () => {
        this.toast.success('Inventory stock initialized successfully.');
        this.showInitModal = false;
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Could not initialize stock row. Check if pair already exists.');
      }
    });
  }

  openAdjustModal(row: Inventory) {
    this.activeRow = row;
    this.deltaValue = 0;
    this.showAdjustModal = true;
  }

  submitDeltaAdjust() {
    if (!this.activeRow || this.deltaValue === 0) return;
    const pId = this.activeRow.product?.id || this.activeRow.productId!;
    const wId = this.activeRow.warehouse?.id || this.activeRow.warehouseId!;

    this.api.adjustInventory(pId, wId, this.deltaValue).subscribe({
      next: () => {
        this.toast.success(`Delta of ${this.deltaValue > 0 ? '+' : ''}${this.deltaValue} applied successfully.`);
        this.showAdjustModal = false;
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to adjust stock delta.');
      }
    });
  }

  openAuditModal(row: Inventory) {
    this.activeRow = row;
    this.exactAuditCount = row.quantity;
    this.showAuditModal = true;
  }

  submitExactAudit() {
    if (!this.activeRow) return;

    this.api.updateInventoryQuantity(this.activeRow.id, this.exactAuditCount).subscribe({
      next: () => {
        this.toast.success(`Stock count updated to ${this.exactAuditCount} units.`);
        this.showAuditModal = false;
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to audit stock count.');
      }
    });
  }

  deleteRow(row: Inventory) {
    if (!confirm(`Are you sure you want to delete this inventory row for ${row.product?.name}?`)) return;

    this.api.deleteInventory(row.id).subscribe({
      next: () => {
        this.toast.success('Inventory record deleted.');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to delete inventory record.');
      }
    });
  }
}
