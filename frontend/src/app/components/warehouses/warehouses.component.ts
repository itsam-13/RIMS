import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Warehouse, Inventory } from '../../models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="warehouses-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="technical-label">PHYSICAL INFRASTRUCTURE</div>
          <h1 class="page-title">Warehouses & Logistics Hubs</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadData()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">
            <i class="ri-add-line"></i>
            <span>REGISTER WAREHOUSE FACILITY</span>
          </button>
        </div>
      </div>

      <!-- Warehouse Facilities Grid -->
      <div class="warehouse-grid" *ngIf="computedWarehouses().length > 0">
        <div *ngFor="let wh of computedWarehouses()" class="wh-card panel">
          <div class="wh-card-top">
            <div>
              <div class="wh-title">{{ wh.name }}</div>
              <div class="wh-location">
                <i class="ri-map-pin-2-line"></i> {{ wh.location }}
              </div>
            </div>
            <span class="wh-badge" [ngClass]="getPercentBadgeClass(wh.fillPercentage || 0)">
              {{ wh.fillPercentage || 0 }}% CAPACITY
            </span>
          </div>

          <!-- Capacity Bar Gauge -->
          <div class="capacity-meter" style="margin: 1rem 0;">
            <div class="capacity-bar-track">
              <div
                class="capacity-bar-fill"
                [ngClass]="getFillBarClass(wh.fillPercentage || 0)"
                [style.width.%]="wh.fillPercentage || 0"
              ></div>
            </div>
            <div class="wh-stat-row">
              <span class="mono"><strong>{{ wh.currentOccupancy | number }}</strong> units stored</span>
              <span class="mono text-muted">{{ wh.capacity | number }} total max</span>
            </div>
          </div>

          <!-- Quick Metrics Ribbon -->
          <div class="wh-metrics-box">
            <div class="wh-metric-item">
              <span class="label">FREE SPACE</span>
              <span class="value mono font-bold" [style.color]="(wh.capacity - (wh.currentOccupancy || 0)) <= 0 ? 'var(--color-danger)' : 'var(--color-success)'">
                {{ (wh.capacity - (wh.currentOccupancy || 0)) | number }}
              </span>
            </div>
            <div class="wh-metric-item">
              <span class="label">SKU LINES</span>
              <span class="value mono font-bold">
                {{ getSkuCountForWarehouse(wh.id) }}
              </span>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="wh-card-actions">
            <button class="btn btn-outline btn-sm" (click)="viewWarehouseInventory(wh)">
              <i class="ri-list-check"></i> VIEW STORED ITEMS
            </button>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm" (click)="openEditModal(wh)" title="Edit Warehouse">
                <i class="ri-edit-line"></i>
              </button>
              <button
                *ngIf="authService.isAdmin()"
                class="btn btn-danger btn-sm"
                (click)="deleteWarehouse(wh)"
                title="Delete Warehouse (Admin only)"
              >
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="computedWarehouses().length === 0 && !loading()" class="empty-state panel">
        <i class="ri-building-line"></i>
        <div>No warehouse hubs registered in system.</div>
      </div>

      <!-- MODAL: CREATE / EDIT WAREHOUSE -->
      <div class="modal-backdrop" *ngIf="showWarehouseModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">{{ isEditing ? 'MODIFY LOGISTICS HUB' : 'NEW FACILITY PROVISIONING' }}</div>
              <div class="section-title">{{ isEditing ? 'Edit: ' + warehouseForm.name : 'Register Warehouse' }}</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showWarehouseModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">FACILITY / WAREHOUSE NAME</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="warehouseForm.name"
                placeholder="e.g. Dallas Distribution Center"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">GEOGRAPHIC LOCATION / CITY</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="warehouseForm.location"
                placeholder="e.g. Dallas, TX"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">MAX CAPACITY (MAX STORAGE UNITS)</label>
              <input
                type="number"
                class="form-control input-mono"
                [(ngModel)]="warehouseForm.capacity"
                min="100"
                placeholder="10000"
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showWarehouseModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="saveWarehouse()"
              [disabled]="!warehouseForm.name || !warehouseForm.location || warehouseForm.capacity <= 0"
            >
              {{ isEditing ? 'UPDATE FACILITY' : 'PROVISION FACILITY' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: VIEW STORED ITEMS IN WAREHOUSE -->
      <div class="modal-backdrop" *ngIf="showItemsModal && selectedWarehouse">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div>
              <div class="technical-label">FACILITY INVENTORY MANIFEST</div>
              <div class="section-title">Stock at {{ selectedWarehouse.name }} ({{ selectedWarehouse.location }})</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showItemsModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>PRODUCT</th>
                    <th>CATEGORY</th>
                    <th>QUANTITY STORED</th>
                    <th>REORDER LEVEL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="activeWarehouseItems.length === 0">
                    <td colspan="6" class="empty-state">
                      <i class="ri-inbox-line"></i>
                      <div>No items currently stocked in this facility.</div>
                    </td>
                  </tr>
                  <tr *ngFor="let item of activeWarehouseItems">
                    <td class="mono font-bold" style="color: var(--accent-primary);">{{ item.product?.sku }}</td>
                    <td style="font-weight: 500;">{{ item.product?.name }}</td>
                    <td>
                      <span class="badge badge-neutral">{{ item.product?.category?.name || 'Unassigned' }}</span>
                    </td>
                    <td class="mono font-bold" style="font-size: 0.95rem;">{{ item.quantity }}</td>
                    <td class="mono text-muted">{{ item.product?.reorderLevel }}</td>
                    <td>
                      <span
                        class="badge"
                        [ngClass]="{
                          'badge-danger': item.quantity <= 0,
                          'badge-warning': item.quantity > 0 && item.quantity <= (item.product?.reorderLevel || 0),
                          'badge-success': item.quantity > (item.product?.reorderLevel || 0)
                        }"
                      >
                        {{
                          item.quantity <= 0
                            ? 'DEPLETED'
                            : item.quantity <= (item.product?.reorderLevel || 0)
                            ? 'LOW STOCK'
                            : 'NORMAL'
                        }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showItemsModal = false">CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .warehouses-page {
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

    .warehouse-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .wh-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      border-radius: var(--radius-md);
      transition: transform var(--transition-fast), border-color var(--transition-fast);
    }
    .wh-card:hover {
      border-color: var(--border-strong);
      transform: translateY(-2px);
    }

    .wh-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .wh-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .wh-location {
      font-size: 0.78rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.15rem;
    }

    .wh-badge {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-xs);
    }

    .wh-stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      margin-top: 0.35rem;
    }

    .wh-metrics-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.75rem;
    }

    .wh-metric-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .wh-metric-item .label {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .wh-metric-item .value {
      font-size: 1rem;
      color: var(--text-primary);
    }

    .wh-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-subtle);
    }
  `]
})
export class WarehousesComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  loading = signal<boolean>(false);
  warehouses = signal<Warehouse[]>([]);
  inventory = signal<Inventory[]>([]);

  showWarehouseModal = false;
  isEditing = false;
  editingId: number | null = null;
  warehouseForm = {
    name: '',
    location: '',
    capacity: 10000
  };

  showItemsModal = false;
  selectedWarehouse: Warehouse | null = null;
  activeWarehouseItems: Inventory[] = [];

  computedWarehouses = computed(() => {
    const inv = this.inventory();
    return this.warehouses().map(wh => {
      const occupied = inv
        .filter(i => (i.warehouse?.id === wh.id) || (i.warehouseId === wh.id))
        .reduce((sum, item) => sum + (item.quantity || 0), 0);
      const cap = wh.capacity > 0 ? wh.capacity : 1000;
      const fillPercentage = Math.min(100, Math.round((occupied / cap) * 100));
      return {
        ...wh,
        currentOccupancy: occupied,
        fillPercentage
      };
    });
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      warehouses: this.api.getWarehouses(),
      inventory: this.api.getInventory()
    }).subscribe({
      next: (res) => {
        this.warehouses.set(res.warehouses || []);
        this.inventory.set(res.inventory || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load warehouses data.', 'Warehouse Error');
      }
    });
  }

  getSkuCountForWarehouse(whId: number): number {
    return this.inventory().filter(i => (i.warehouse?.id === whId) || (i.warehouseId === whId)).length;
  }

  getFillBarClass(pct: number): string {
    if (pct >= 90) return 'fill-crit';
    if (pct >= 70) return 'fill-warn';
    return 'fill-safe';
  }

  getPercentBadgeClass(pct: number): string {
    if (pct >= 90) return 'badge-danger';
    if (pct >= 70) return 'badge-warning';
    return 'badge-success';
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.warehouseForm = {
      name: '',
      location: '',
      capacity: 10000
    };
    this.showWarehouseModal = true;
  }

  openEditModal(wh: Warehouse) {
    this.isEditing = true;
    this.editingId = wh.id;
    this.warehouseForm = {
      name: wh.name,
      location: wh.location,
      capacity: wh.capacity
    };
    this.showWarehouseModal = true;
  }

  saveWarehouse() {
    const payload: Partial<Warehouse> = {
      name: this.warehouseForm.name,
      location: this.warehouseForm.location,
      capacity: this.warehouseForm.capacity
    };

    if (this.isEditing && this.editingId) {
      this.api.updateWarehouse(this.editingId, payload).subscribe({
        next: () => {
          this.toast.success('Warehouse updated successfully.');
          this.showWarehouseModal = false;
          this.loadData();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to update warehouse.');
        }
      });
    } else {
      this.api.createWarehouse(payload).subscribe({
        next: () => {
          this.toast.success('Warehouse facility provisioned.');
          this.showWarehouseModal = false;
          this.loadData();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to provision warehouse.');
        }
      });
    }
  }

  deleteWarehouse(wh: Warehouse) {
    if (!confirm(`Delete facility "${wh.name}"? This action cannot be reversed.`)) return;

    this.api.deleteWarehouse(wh.id).subscribe({
      next: () => {
        this.toast.success('Warehouse deleted.');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to delete warehouse.');
      }
    });
  }

  viewWarehouseInventory(wh: Warehouse) {
    this.selectedWarehouse = wh;
    this.activeWarehouseItems = this.inventory().filter(
      i => (i.warehouse?.id === wh.id) || (i.warehouseId === wh.id)
    );
    this.showItemsModal = true;
  }
}
