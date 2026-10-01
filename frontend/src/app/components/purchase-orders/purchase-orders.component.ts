import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { PurchaseOrder, Supplier, Warehouse, Product, POStatus } from '../../models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="po-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="technical-label">SUPPLIER PROCUREMENT</div>
          <h1 class="page-title">Purchase Orders & Inbound Receiving</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadData()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">
            <i class="ri-add-line"></i>
            <span>ISSUE PURCHASE ORDER</span>
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-panel panel">
        <div class="filter-grid">
          <div>
            <label class="form-label">FILTER BY STATUS</label>
            <select class="form-select" [(ngModel)]="statusFilter">
              <option value="ALL">ALL STATUSES ({{ purchaseOrders().length }})</option>
              <option value="PENDING">PENDING</option>
              <option value="ORDERED">ORDERED (INBOUND TRANSIT)</option>
              <option value="RECEIVED">RECEIVED (IN STOCK)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label class="form-label">DESTINATION WAREHOUSE</label>
            <select class="form-select" [(ngModel)]="warehouseFilter">
              <option [ngValue]="null">ALL DESTINATIONS</option>
              <option *ngFor="let w of warehouses()" [ngValue]="w.id">{{ w.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- PO Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>ORDER DATE</th>
              <th>SUPPLIER</th>
              <th>DESTINATION HUB</th>
              <th>ITEMS</th>
              <th>ESTIMATED TOTAL</th>
              <th>STATUS</th>
              <th style="text-align: right;">PROCUREMENT ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredPOs().length === 0">
              <td colspan="8" class="empty-state">
                <i class="ri-truck-line"></i>
                <div>No purchase orders found.</div>
              </td>
            </tr>
            <tr *ngFor="let po of filteredPOs()">
              <td class="mono font-bold" style="color: var(--accent-primary);">PO-{{ po.id }}</td>
              <td class="mono" style="font-size: 0.78rem;">{{ po.orderDate | slice:0:19 }}</td>
              <td>
                <div style="font-weight: 600;">{{ po.supplier?.name || 'Supplier #' + po.supplierId }}</div>
                <div class="text-muted" style="font-size: 0.72rem;">{{ po.supplier?.contactEmail }}</div>
              </td>
              <td>
                <div style="font-weight: 500;">{{ po.warehouse?.name || 'Warehouse #' + po.warehouseId }}</div>
                <div class="text-muted" style="font-size: 0.72rem;">{{ po.warehouse?.location }}</div>
              </td>
              <td class="mono">
                <button class="btn btn-ghost btn-sm" (click)="viewDetails(po)" style="font-family: var(--font-mono);">
                  <i class="ri-file-list-3-line"></i> {{ po.items?.length || 0 }} item(s)
                </button>
              </td>
              <td class="mono font-bold">
                \${{ calculatePOTotal(po) | number:'1.2-2' }}
              </td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-neutral': po.status === 'PENDING',
                    'badge-info': po.status === 'ORDERED',
                    'badge-success': po.status === 'RECEIVED',
                    'badge-danger': po.status === 'CANCELLED'
                  }"
                >
                  <span class="badge-dot"></span>
                  {{ po.status }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <!-- PENDING -> ORDERED -->
                  <button
                    *ngIf="po.status === 'PENDING'"
                    class="btn btn-outline btn-sm"
                    (click)="markOrdered(po)"
                    title="Mark as Dispatched by Supplier"
                  >
                    <i class="ri-send-plane-line"></i> DISPATCH
                  </button>

                  <!-- ORDERED -> RECEIVED -->
                  <button
                    *ngIf="po.status === 'ORDERED'"
                    class="btn btn-primary btn-sm"
                    (click)="markReceived(po)"
                    title="Receive shipment and increment warehouse stock"
                  >
                    <i class="ri-inbox-archive-line"></i> RECEIVE STOCK
                  </button>

                  <!-- CANCEL -->
                  <button
                    *ngIf="po.status === 'PENDING' || po.status === 'ORDERED'"
                    class="btn btn-danger btn-sm"
                    (click)="cancelPO(po)"
                    title="Cancel Purchase Order"
                  >
                    <i class="ri-close-circle-line"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL: ISSUE NEW PURCHASE ORDER -->
      <div class="modal-backdrop" *ngIf="showCreateModal">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div>
              <div class="technical-label">PROCUREMENT ORDER MANIFEST</div>
              <div class="section-title">Issue Inbound Purchase Order</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showCreateModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">SUPPLIER</label>
                <select class="form-select" [(ngModel)]="newPO.supplierId" required>
                  <option [ngValue]="null" disabled>Choose vendor/supplier...</option>
                  <option *ngFor="let s of suppliers()" [ngValue]="s.id">
                    {{ s.name }} (Lead time: {{ s.leadTimeDays }}d)
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">DESTINATION RECEIVING WAREHOUSE</label>
                <select class="form-select" [(ngModel)]="newPO.warehouseId" required>
                  <option [ngValue]="null" disabled>Choose destination hub...</option>
                  <option *ngFor="let w of warehouses()" [ngValue]="w.id">
                    {{ w.name }} ({{ w.location }}) — Cap: {{ w.capacity }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Dynamic Line Items Section -->
            <div class="items-header-bar">
              <div class="technical-label">PURCHASE ORDER LINE ITEMS</div>
              <button class="btn btn-secondary btn-sm" (click)="addLineItem()">
                <i class="ri-add-line"></i> ADD ITEM
              </button>
            </div>

            <div class="line-items-list">
              <div *ngFor="let item of newPO.items; let idx = index" class="line-item-row">
                <div class="item-select-col">
                  <label class="form-label" *ngIf="idx === 0">PRODUCT / SKU</label>
                  <select class="form-select" [(ngModel)]="item.productId" (change)="onProductSelect(item)">
                    <option [ngValue]="null" disabled>Select product...</option>
                    <option *ngFor="let p of products()" [ngValue]="p.id">
                      [{{ p.sku }}] {{ p.name }}
                    </option>
                  </select>
                </div>

                <div class="item-qty-col">
                  <label class="form-label" *ngIf="idx === 0">QUANTITY</label>
                  <input
                    type="number"
                    class="form-control input-mono"
                    [(ngModel)]="item.quantity"
                    min="1"
                    placeholder="Qty"
                  />
                </div>

                <div class="item-cost-col">
                  <label class="form-label" *ngIf="idx === 0">UNIT COST ($)</label>
                  <input
                    type="number"
                    class="form-control input-mono"
                    [(ngModel)]="item.unitCost"
                    min="0"
                    step="0.01"
                    placeholder="Cost"
                  />
                </div>

                <div class="item-subtotal-col">
                  <label class="form-label" *ngIf="idx === 0">LINE TOTAL</label>
                  <div class="mono line-total-val">\${{ (item.quantity * item.unitCost) | number:'1.2-2' }}</div>
                </div>

                <div class="item-remove-col">
                  <label class="form-label" *ngIf="idx === 0">&nbsp;</label>
                  <button
                    class="btn btn-ghost btn-sm"
                    (click)="removeItem(idx)"
                    [disabled]="newPO.items.length === 1"
                    style="color: var(--color-danger);"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Grand Total Bar -->
            <div class="po-grand-total">
              <span class="technical-label">ESTIMATED TOTAL ORDER VALUE:</span>
              <span class="mono total-amount">\${{ calculateNewPOTotal() | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showCreateModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="submitPurchaseOrder()"
              [disabled]="!newPO.supplierId || !newPO.warehouseId || !isNewPOValid()"
            >
              TRANSMIT PURCHASE ORDER
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: VIEW DETAILS -->
      <div class="modal-backdrop" *ngIf="showDetailsModal && selectedPO">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">PO DETAILS // MANIFEST</div>
              <div class="section-title">Purchase Order #{{ selectedPO.id }} ({{ selectedPO.status }})</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showDetailsModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ITEM</th>
                    <th>QTY</th>
                    <th>UNIT COST</th>
                    <th>LINE TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of selectedPO.items">
                    <td>
                      <strong>{{ item.product?.name || 'Product #' + item.productId }}</strong>
                      <div class="mono text-muted" style="font-size: 0.72rem;">{{ item.product?.sku }}</div>
                    </td>
                    <td class="mono font-bold">{{ item.quantity }}</td>
                    <td class="mono">\${{ item.unitCost | number:'1.2-2' }}</td>
                    <td class="mono font-bold">\${{ (item.quantity * item.unitCost) | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDetailsModal = false">CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .po-page {
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
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .items-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 1.25rem 0 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .line-items-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 260px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .line-item-row {
      display: flex;
      gap: 0.6rem;
      align-items: flex-end;
    }

    .item-select-col { flex: 2; }
    .item-qty-col { width: 100px; }
    .item-cost-col { width: 120px; }
    .item-subtotal-col { width: 120px; }
    .item-remove-col { width: 40px; }

    .line-total-val {
      padding: 0.6rem 0.2rem;
      font-weight: 600;
      color: var(--accent-primary);
    }

    .po-grand-total {
      margin-top: 1.25rem;
      padding: 0.85rem 1rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-success);
    }

    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
    }
  `]
})
export class PurchaseOrdersComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = signal<boolean>(false);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([]);

  statusFilter = 'ALL';
  warehouseFilter: number | null = null;

  showCreateModal = false;
  newPO = {
    supplierId: null as number | null,
    warehouseId: null as number | null,
    status: 'PENDING' as POStatus,
    items: [
      { productId: null as number | null, quantity: 10, unitCost: 50.00 }
    ]
  };

  showDetailsModal = false;
  selectedPO: PurchaseOrder | null = null;

  filteredPOs = computed(() => {
    let list = this.purchaseOrders();
    if (this.statusFilter !== 'ALL') {
      list = list.filter(po => po.status === this.statusFilter);
    }
    if (this.warehouseFilter) {
      list = list.filter(po => (po.warehouse?.id === this.warehouseFilter) || (po.warehouseId === this.warehouseFilter));
    }
    return list;
  });

  ngOnInit() {
    this.loadData();
    this.route.queryParams.subscribe(params => {
      if (params['reorderProductId']) {
        const prodId = Number(params['reorderProductId']);
        setTimeout(() => this.openCreateModal(prodId), 500);
      }
    });
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      pos: this.api.getPurchaseOrders(),
      suppliers: this.api.getSuppliers(),
      warehouses: this.api.getWarehouses(),
      products: this.api.getProducts()
    }).subscribe({
      next: (res) => {
        this.purchaseOrders.set(res.pos || []);
        this.suppliers.set(res.suppliers || []);
        this.warehouses.set(res.warehouses || []);
        this.products.set(res.products || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load purchase orders.', 'Procurement Error');
      }
    });
  }

  calculatePOTotal(po: PurchaseOrder): number {
    if (!po.items) return 0;
    return po.items.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0);
  }

  calculateNewPOTotal(): number {
    return this.newPO.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
  }

  openCreateModal(preselectedProductId?: number) {
    const sId = this.suppliers().length > 0 ? this.suppliers()[0].id : null;
    const wId = this.warehouses().length > 0 ? this.warehouses()[0].id : null;
    const pId = preselectedProductId || (this.products().length > 0 ? this.products()[0].id : null);
    const cost = preselectedProductId
      ? (this.products().find(p => p.id === preselectedProductId)?.price || 50)
      : 50;

    this.newPO = {
      supplierId: sId,
      warehouseId: wId,
      status: 'PENDING',
      items: [
        { productId: pId, quantity: 20, unitCost: cost }
      ]
    };
    this.showCreateModal = true;
  }

  addLineItem() {
    const pId = this.products().length > 0 ? this.products()[0].id : null;
    this.newPO.items.push({ productId: pId, quantity: 10, unitCost: 25 });
  }

  removeItem(idx: number) {
    if (this.newPO.items.length > 1) {
      this.newPO.items.splice(idx, 1);
    }
  }

  onProductSelect(item: any) {
    const found = this.products().find(p => p.id === item.productId);
    if (found) {
      item.unitCost = found.price || 50;
    }
  }

  isNewPOValid(): boolean {
    return this.newPO.items.every(item => item.productId && item.quantity > 0 && item.unitCost >= 0);
  }

  submitPurchaseOrder() {
    if (!this.newPO.supplierId || !this.newPO.warehouseId || !this.isNewPOValid()) return;

    const payload = {
      supplierId: this.newPO.supplierId,
      warehouseId: this.newPO.warehouseId,
      status: 'PENDING',
      items: this.newPO.items.map(it => ({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost
      }))
    };

    this.api.createPurchaseOrder(payload).subscribe({
      next: (po) => {
        this.toast.success(`Purchase Order PO-${po.id} issued successfully.`);
        this.showCreateModal = false;
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to issue purchase order.');
      }
    });
  }

  markOrdered(po: PurchaseOrder) {
    this.api.markPOOrdered(po.id).subscribe({
      next: () => {
        this.toast.info(`PO-${po.id} status changed to ORDERED.`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Could not update status to ORDERED.');
      }
    });
  }

  markReceived(po: PurchaseOrder) {
    this.api.markPOReceived(po.id).subscribe({
      next: () => {
        this.toast.success(`PO-${po.id} stock received! Inventory incremented in destination hub.`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Could not receive shipment.');
      }
    });
  }

  cancelPO(po: PurchaseOrder) {
    if (!confirm(`Cancel purchase order PO-${po.id}?`)) return;

    this.api.cancelPO(po.id).subscribe({
      next: () => {
        this.toast.warning(`PO-${po.id} cancelled.`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to cancel PO.');
      }
    });
  }

  viewDetails(po: PurchaseOrder) {
    this.selectedPO = po;
    this.showDetailsModal = true;
  }
}
