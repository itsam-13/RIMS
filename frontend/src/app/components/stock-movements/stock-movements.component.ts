import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { StockMovement, Product, Warehouse, MovementType } from '../../models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="movements-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="technical-label">AUDIT TRAIL & INTER-HUB LOGISTICS</div>
          <h1 class="page-title">Stock Movements & Inter-Warehouse Transfers</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadData()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openTransferModal()">
            <i class="ri-arrow-left-right-line"></i>
            <span>RECORD STOCK TRANSFER / MOVEMENT</span>
          </button>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="filter-panel panel">
        <div class="filter-grid">
          <div>
            <label class="form-label">MOVEMENT TYPE</label>
            <select class="form-select" [(ngModel)]="typeFilter">
              <option value="ALL">ALL TYPES ({{ movements().length }})</option>
              <option value="TRANSFER">INTER-WAREHOUSE TRANSFER</option>
              <option value="IN">INBOUND RESTOCK (IN)</option>
              <option value="OUT">OUTBOUND REMOVAL (OUT)</option>
            </select>
          </div>
          <div>
            <label class="form-label">FILTER BY PRODUCT</label>
            <select class="form-select" [(ngModel)]="productFilter">
              <option [ngValue]="null">ALL PRODUCTS</option>
              <option *ngFor="let p of products()" [ngValue]="p.id">
                [{{ p.sku }}] {{ p.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Movements Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>LOG ID</th>
              <th>TIMESTAMP</th>
              <th>TYPE</th>
              <th>PRODUCT / SKU</th>
              <th>ORIGIN FACILITY</th>
              <th>DESTINATION FACILITY</th>
              <th>DELTA UNITS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredMovements().length === 0">
              <td colspan="7" class="empty-state">
                <i class="ri-history-line"></i>
                <div>No stock movements found.</div>
              </td>
            </tr>
            <tr *ngFor="let mov of filteredMovements()">
              <td class="mono text-muted">#{{ mov.id }}</td>
              <td class="mono" style="font-size: 0.76rem;">{{ mov.timestamp | slice:0:19 }}</td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-success': mov.type === 'IN',
                    'badge-danger': mov.type === 'OUT',
                    'badge-purple': mov.type === 'TRANSFER'
                  }"
                >
                  <span class="badge-dot"></span>
                  {{ mov.type }}
                </span>
              </td>
              <td>
                <div style="font-weight: 600;">{{ mov.product?.name || 'Product #' + mov.productId }}</div>
                <div class="mono text-muted" style="font-size: 0.72rem;">{{ mov.product?.sku }}</div>
              </td>
              <td class="mono">
                <span *ngIf="mov.fromWarehouse">{{ mov.fromWarehouse.name }}</span>
                <span *ngIf="!mov.fromWarehouse && mov.fromWarehouseId">Hub #{{ mov.fromWarehouseId }}</span>
                <span *ngIf="!mov.fromWarehouse && !mov.fromWarehouseId" class="text-muted">—</span>
              </td>
              <td class="mono">
                <span *ngIf="mov.toWarehouse">{{ mov.toWarehouse.name }}</span>
                <span *ngIf="!mov.toWarehouse && mov.toWarehouseId">Hub #{{ mov.toWarehouseId }}</span>
                <span *ngIf="!mov.toWarehouse && !mov.toWarehouseId" class="text-muted">—</span>
              </td>
              <td class="mono font-bold" [style.color]="mov.type === 'IN' ? 'var(--color-success)' : mov.type === 'OUT' ? 'var(--color-danger)' : 'var(--accent-primary)'">
                {{ mov.type === 'IN' ? '+' : mov.type === 'OUT' ? '-' : '' }}{{ mov.quantity }} units
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL: RECORD STOCK MOVEMENT / TRANSFER -->
      <div class="modal-backdrop" *ngIf="showTransferModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">INVENTORY MOVEMENT DISPATCH</div>
              <div class="section-title">Record Stock Movement</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showTransferModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">MOVEMENT TYPE</label>
              <select class="form-select" [(ngModel)]="movementForm.type">
                <option value="TRANSFER">TRANSFER — Inter-Warehouse Transfer</option>
                <option value="IN">IN — Inbound Stock Receipt</option>
                <option value="OUT">OUT — Outbound Stock Removal</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">PRODUCT TO MOVE</label>
              <select class="form-select" [(ngModel)]="movementForm.productId" required>
                <option [ngValue]="null" disabled>Choose product...</option>
                <option *ngFor="let p of products()" [ngValue]="p.id">
                  [{{ p.sku }}] {{ p.name }}
                </option>
              </select>
            </div>

            <!-- Source Warehouse (for TRANSFER and OUT) -->
            <div class="form-group" *ngIf="movementForm.type === 'TRANSFER' || movementForm.type === 'OUT'">
              <label class="form-label">SOURCE WAREHOUSE (FROM)</label>
              <select class="form-select" [(ngModel)]="movementForm.fromWarehouseId" required>
                <option [ngValue]="null" disabled>Select source hub...</option>
                <option *ngFor="let w of warehouses()" [ngValue]="w.id">
                  {{ w.name }} ({{ w.location }})
                </option>
              </select>
            </div>

            <!-- Destination Warehouse (for TRANSFER and IN) -->
            <div class="form-group" *ngIf="movementForm.type === 'TRANSFER' || movementForm.type === 'IN'">
              <label class="form-label">DESTINATION WAREHOUSE (TO)</label>
              <select class="form-select" [(ngModel)]="movementForm.toWarehouseId" required>
                <option [ngValue]="null" disabled>Select target hub...</option>
                <option *ngFor="let w of warehouses()" [ngValue]="w.id" [disabled]="movementForm.type === 'TRANSFER' && w.id === movementForm.fromWarehouseId">
                  {{ w.name }} ({{ w.location }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">QUANTITY UNITS</label>
              <input
                type="number"
                class="form-control input-mono"
                [(ngModel)]="movementForm.quantity"
                min="1"
                placeholder="Units to transfer"
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showTransferModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="submitMovement()"
              [disabled]="!isMovementValid()"
            >
              EXECUTE MOVEMENT
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .movements-page {
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
      grid-template-columns: 1fr 1.5fr;
      gap: 1rem;
    }
  `]
})
export class StockMovementsComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);

  loading = signal<boolean>(false);
  movements = signal<StockMovement[]>([]);
  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);

  typeFilter = 'ALL';
  productFilter: number | null = null;

  showTransferModal = false;
  movementForm = {
    type: 'TRANSFER' as MovementType,
    productId: null as number | null,
    fromWarehouseId: null as number | null,
    toWarehouseId: null as number | null,
    quantity: 10
  };

  filteredMovements = computed(() => {
    let list = this.movements();
    if (this.typeFilter !== 'ALL') {
      list = list.filter(m => m.type === this.typeFilter);
    }
    if (this.productFilter) {
      list = list.filter(m => (m.product?.id === this.productFilter) || (m.productId === this.productFilter));
    }
    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      movements: this.api.getStockMovements(),
      products: this.api.getProducts(),
      warehouses: this.api.getWarehouses()
    }).subscribe({
      next: (res) => {
        const sorted = (res.movements || []).sort((a, b) => (b.id || 0) - (a.id || 0));
        this.movements.set(sorted);
        this.products.set(res.products || []);
        this.warehouses.set(res.warehouses || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to sync movements ledger.', 'Audit Error');
      }
    });
  }

  openTransferModal() {
    const pId = this.products().length > 0 ? this.products()[0].id : null;
    const w1 = this.warehouses().length > 0 ? this.warehouses()[0].id : null;
    const w2 = this.warehouses().length > 1 ? this.warehouses()[1].id : null;

    this.movementForm = {
      type: 'TRANSFER',
      productId: pId,
      fromWarehouseId: w1,
      toWarehouseId: w2,
      quantity: 10
    };
    this.showTransferModal = true;
  }

  isMovementValid(): boolean {
    if (!this.movementForm.productId || this.movementForm.quantity <= 0) return false;

    if (this.movementForm.type === 'TRANSFER') {
      return !!this.movementForm.fromWarehouseId &&
             !!this.movementForm.toWarehouseId &&
             this.movementForm.fromWarehouseId !== this.movementForm.toWarehouseId;
    }
    if (this.movementForm.type === 'IN') {
      return !!this.movementForm.toWarehouseId;
    }
    if (this.movementForm.type === 'OUT') {
      return !!this.movementForm.fromWarehouseId;
    }
    return false;
  }

  submitMovement() {
    if (!this.isMovementValid()) return;

    const payload: any = {
      productId: this.movementForm.productId,
      quantity: this.movementForm.quantity,
      type: this.movementForm.type
    };

    if (this.movementForm.type === 'TRANSFER' || this.movementForm.type === 'OUT') {
      payload.fromWarehouseId = this.movementForm.fromWarehouseId;
    }
    if (this.movementForm.type === 'TRANSFER' || this.movementForm.type === 'IN') {
      payload.toWarehouseId = this.movementForm.toWarehouseId;
    }

    this.api.recordStockMovement(payload).subscribe({
      next: () => {
        this.toast.success(`Movement [${this.movementForm.type}] of ${this.movementForm.quantity} units executed.`);
        this.showTransferModal = false;
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to execute stock movement.');
      }
    });
  }
}
