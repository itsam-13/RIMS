import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import {
  CustomerOrder,
  Warehouse,
  Product,
  Inventory,
  User,
  OrderStatus
} from '../../models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="technical-label">OUTBOUND FULFILLMENT</div>
          <h1 class="page-title">Customer Sales Orders & Dispatch</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadData()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openPlaceOrderModal()">
            <i class="ri-add-line"></i>
            <span>PLACE NEW SALES ORDER</span>
          </button>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="filter-panel panel">
        <div class="filter-grid">
          <div>
            <label class="form-label">FILTER BY STATUS</label>
            <select class="form-select" [(ngModel)]="statusFilter">
              <option value="ALL">ALL STATUSES ({{ customerOrders().length }})</option>
              <option value="PLACED">PLACED (STOCK RESERVED)</option>
              <option value="SHIPPED">SHIPPED (IN TRANSIT)</option>
              <option value="DELIVERED">DELIVERED (FULFILLED)</option>
              <option value="CANCELLED">CANCELLED (RESTOCKED)</option>
            </select>
          </div>
          <div>
            <label class="form-label">FULFILLMENT WAREHOUSE</label>
            <select class="form-select" [(ngModel)]="warehouseFilter">
              <option [ngValue]="null">ALL HUBS</option>
              <option *ngFor="let w of warehouses()" [ngValue]="w.id">{{ w.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Customer Orders Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ORDER #</th>
              <th>ORDER DATE</th>
              <th>CUSTOMER NAME</th>
              <th>FULFILLMENT HUB</th>
              <th>SALES OPERATOR</th>
              <th>ITEMS</th>
              <th>TOTAL VALUE</th>
              <th>STATUS</th>
              <th style="text-align: right;">FULFILLMENT DISPATCH</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredOrders().length === 0">
              <td colspan="9" class="empty-state">
                <i class="ri-shopping-cart-line"></i>
                <div>No customer sales orders found.</div>
              </td>
            </tr>
            <tr *ngFor="let ord of filteredOrders()">
              <td class="mono font-bold" style="color: var(--accent-primary);">ORD-{{ ord.id }}</td>
              <td class="mono" style="font-size: 0.78rem;">{{ ord.orderDate | slice:0:19 }}</td>
              <td style="font-weight: 600;">{{ ord.customerName }}</td>
              <td>
                <div style="font-weight: 500;">{{ ord.warehouse?.name || 'Warehouse #' + ord.warehouseId }}</div>
                <div class="text-muted" style="font-size: 0.72rem;">{{ ord.warehouse?.location }}</div>
              </td>
              <td>
                <span class="badge badge-neutral">
                  <i class="ri-user-line"></i> {{ ord.user?.username || 'System' }}
                </span>
              </td>
              <td class="mono">
                <button class="btn btn-ghost btn-sm" (click)="viewDetails(ord)" style="font-family: var(--font-mono);">
                  <i class="ri-file-list-3-line"></i> {{ ord.items?.length || 0 }} item(s)
                </button>
              </td>
              <td class="mono font-bold">
                \${{ calculateOrderTotal(ord) | number:'1.2-2' }}
              </td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-info': ord.status === 'PLACED',
                    'badge-purple': ord.status === 'SHIPPED',
                    'badge-success': ord.status === 'DELIVERED',
                    'badge-danger': ord.status === 'CANCELLED'
                  }"
                >
                  <span class="badge-dot"></span>
                  {{ ord.status }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <!-- PLACED -> SHIPPED -->
                  <button
                    *ngIf="ord.status === 'PLACED'"
                    class="btn btn-outline btn-sm"
                    (click)="markShipped(ord)"
                    title="Dispatch Shipment"
                  >
                    <i class="ri-truck-line"></i> SHIP
                  </button>

                  <!-- SHIPPED -> DELIVERED -->
                  <button
                    *ngIf="ord.status === 'SHIPPED'"
                    class="btn btn-primary btn-sm"
                    (click)="markDelivered(ord)"
                    title="Confirm Delivery"
                  >
                    <i class="ri-checkbox-circle-line"></i> DELIVER
                  </button>

                  <!-- CANCEL -->
                  <button
                    *ngIf="ord.status === 'PLACED' || ord.status === 'SHIPPED'"
                    class="btn btn-danger btn-sm"
                    (click)="cancelOrder(ord)"
                    title="Cancel Order & Restock Inventory"
                  >
                    <i class="ri-close-circle-line"></i> CANCEL
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL: PLACE CUSTOMER SALES ORDER -->
      <div class="modal-backdrop" *ngIf="showPlaceOrderModal">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div>
              <div class="technical-label">ORDER ENTRY // REAL-TIME STOCK VERIFICATION</div>
              <div class="section-title">Place Customer Sales Order</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showPlaceOrderModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">CUSTOMER NAME / CLIENT ENTITY</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="newOrder.customerName"
                  placeholder="e.g. Acme Retailers Inc."
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">FULFILLMENT WAREHOUSE HUB</label>
                <select class="form-select" [(ngModel)]="newOrder.warehouseId" (change)="onWarehouseChange()" required>
                  <option [ngValue]="null" disabled>Choose warehouse hub...</option>
                  <option *ngFor="let w of warehouses()" [ngValue]="w.id">
                    {{ w.name }} ({{ w.location }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Dynamic Line Items Section -->
            <div class="items-header-bar">
              <div class="technical-label">REQUESTED LINE ITEMS</div>
              <button class="btn btn-secondary btn-sm" (click)="addLineItem()">
                <i class="ri-add-line"></i> ADD ITEM
              </button>
            </div>

            <div class="line-items-list">
              <div *ngFor="let item of newOrder.items; let idx = index" class="line-item-row">
                <div class="item-select-col">
                  <label class="form-label" *ngIf="idx === 0">PRODUCT / SKU</label>
                  <select class="form-select" [(ngModel)]="item.productId" (change)="onProductSelect(item)">
                    <option [ngValue]="null" disabled>Select product...</option>
                    <option *ngFor="let p of products()" [ngValue]="p.id">
                      [{{ p.sku }}] {{ p.name }} (\${{ p.price }})
                    </option>
                  </select>
                  <!-- Real-time stock status badge -->
                  <div class="stock-check-line" *ngIf="newOrder.warehouseId && item.productId">
                    <span
                      class="stock-badge"
                      [class.shortage]="getAvailableStock(item.productId, newOrder.warehouseId) < item.quantity"
                    >
                      <i class="ri-archive-line"></i>
                      Available in hub: <strong>{{ getAvailableStock(item.productId, newOrder.warehouseId) }}</strong> units
                      <span *ngIf="getAvailableStock(item.productId, newOrder.warehouseId) < item.quantity" class="shortage-text">
                        [INSUFFICIENT STOCK!]
                      </span>
                    </span>
                  </div>
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
                  <label class="form-label" *ngIf="idx === 0">UNIT PRICE ($)</label>
                  <input
                    type="number"
                    class="form-control input-mono"
                    [(ngModel)]="item.unitPrice"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                  />
                </div>

                <div class="item-subtotal-col">
                  <label class="form-label" *ngIf="idx === 0">SUBTOTAL</label>
                  <div class="mono line-total-val">\${{ (item.quantity * item.unitPrice) | number:'1.2-2' }}</div>
                </div>

                <div class="item-remove-col">
                  <label class="form-label" *ngIf="idx === 0">&nbsp;</label>
                  <button
                    class="btn btn-ghost btn-sm"
                    (click)="removeItem(idx)"
                    [disabled]="newOrder.items.length === 1"
                    style="color: var(--color-danger);"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Grand Total Bar -->
            <div class="order-grand-total">
              <span class="technical-label">ORDER TOTAL:</span>
              <span class="mono total-amount">\${{ calculateNewOrderTotal() | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showPlaceOrderModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="submitCustomerOrder()"
              [disabled]="!newOrder.customerName || !newOrder.warehouseId || !isNewOrderValid()"
            >
              CONFIRM & RESERVE STOCK
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: VIEW DETAILS -->
      <div class="modal-backdrop" *ngIf="showDetailsModal && selectedOrder">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">ORDER MANIFEST</div>
              <div class="section-title">Customer Order #{{ selectedOrder.id }} ({{ selectedOrder.status }})</div>
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
                    <th>UNIT PRICE</th>
                    <th>LINE TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of selectedOrder.items">
                    <td>
                      <strong>{{ item.product?.name || 'Product #' + item.productId }}</strong>
                      <div class="mono text-muted" style="font-size: 0.72rem;">{{ item.product?.sku }}</div>
                    </td>
                    <td class="mono font-bold">{{ item.quantity }}</td>
                    <td class="mono">\${{ item.unitPrice | number:'1.2-2' }}</td>
                    <td class="mono font-bold">\${{ (item.quantity * item.unitPrice) | number:'1.2-2' }}</td>
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
    .orders-page {
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
      gap: 0.85rem;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .line-item-row {
      display: flex;
      gap: 0.6rem;
      align-items: flex-end;
    }

    .item-select-col { flex: 2; }
    .item-qty-col { width: 95px; }
    .item-cost-col { width: 115px; }
    .item-subtotal-col { width: 115px; }
    .item-remove-col { width: 40px; }

    .line-total-val {
      padding: 0.6rem 0.2rem;
      font-weight: 600;
      color: var(--accent-primary);
    }

    .stock-check-line {
      margin-top: 0.35rem;
      font-size: 0.72rem;
    }

    .stock-badge {
      font-family: var(--font-mono);
      color: var(--color-success);
    }
    .stock-badge.shortage {
      color: var(--color-danger);
      font-weight: 600;
    }
    .shortage-text {
      color: var(--color-danger);
      font-weight: 700;
      margin-left: 0.25rem;
    }

    .order-grand-total {
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
export class CustomerOrdersComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  loading = signal<boolean>(false);
  customerOrders = signal<CustomerOrder[]>([]);
  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([]);
  inventory = signal<Inventory[]>([]);

  statusFilter = 'ALL';
  warehouseFilter: number | null = null;

  showPlaceOrderModal = false;
  newOrder = {
    customerName: '',
    warehouseId: null as number | null,
    status: 'PLACED' as OrderStatus,
    items: [
      { productId: null as number | null, quantity: 1, unitPrice: 100.00 }
    ]
  };

  showDetailsModal = false;
  selectedOrder: CustomerOrder | null = null;

  filteredOrders = computed(() => {
    let list = this.customerOrders();
    if (this.statusFilter !== 'ALL') {
      list = list.filter(o => o.status === this.statusFilter);
    }
    if (this.warehouseFilter) {
      list = list.filter(o => (o.warehouse?.id === this.warehouseFilter) || (o.warehouseId === this.warehouseFilter));
    }
    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      orders: this.api.getCustomerOrders(),
      warehouses: this.api.getWarehouses(),
      products: this.api.getProducts(),
      inventory: this.api.getInventory()
    }).subscribe({
      next: (res) => {
        this.customerOrders.set(res.orders || []);
        this.warehouses.set(res.warehouses || []);
        this.products.set(res.products || []);
        this.inventory.set(res.inventory || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load customer orders.', 'Sales Sync Error');
      }
    });
  }

  calculateOrderTotal(ord: CustomerOrder): number {
    if (!ord.items) return 0;
    return ord.items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  }

  calculateNewOrderTotal(): number {
    return this.newOrder.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }

  getAvailableStock(productId: number | null, warehouseId: number | null): number {
    if (!productId || !warehouseId) return 0;
    const item = this.inventory().find(i =>
      ((i.product?.id === productId) || (i.productId === productId)) &&
      ((i.warehouse?.id === warehouseId) || (i.warehouseId === warehouseId))
    );
    return item ? item.quantity : 0;
  }

  openPlaceOrderModal() {
    const wId = this.warehouses().length > 0 ? this.warehouses()[0].id : null;
    const pId = this.products().length > 0 ? this.products()[0].id : null;
    const price = this.products().length > 0 ? (this.products()[0].price || 100) : 100;

    this.newOrder = {
      customerName: '',
      warehouseId: wId,
      status: 'PLACED',
      items: [
        { productId: pId, quantity: 1, unitPrice: price }
      ]
    };
    this.showPlaceOrderModal = true;
  }

  addLineItem() {
    const pId = this.products().length > 0 ? this.products()[0].id : null;
    const price = this.products().length > 0 ? (this.products()[0].price || 100) : 100;
    this.newOrder.items.push({ productId: pId, quantity: 1, unitPrice: price });
  }

  removeItem(idx: number) {
    if (this.newOrder.items.length > 1) {
      this.newOrder.items.splice(idx, 1);
    }
  }

  onWarehouseChange() {
    // triggers UI update of available stock
  }

  onProductSelect(item: any) {
    const found = this.products().find(p => p.id === item.productId);
    if (found) {
      item.unitPrice = found.price || 100;
    }
  }

  isNewOrderValid(): boolean {
    if (!this.newOrder.customerName.trim() || !this.newOrder.warehouseId) return false;
    return this.newOrder.items.every(item => {
      if (!item.productId || item.quantity <= 0 || item.unitPrice < 0) return false;
      const available = this.getAvailableStock(item.productId, this.newOrder.warehouseId);
      return available >= item.quantity;
    });
  }

  submitCustomerOrder() {
    if (!this.isNewOrderValid()) {
      this.toast.error('Cannot place order: Please verify item quantities do not exceed available warehouse stock.');
      return;
    }

    const payload = {
      customerName: this.newOrder.customerName.trim(),
      warehouseId: this.newOrder.warehouseId,
      status: 'PLACED',
      items: this.newOrder.items.map(it => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      }))
    };

    this.api.placeCustomerOrder(payload).subscribe({
      next: (order) => {
        this.toast.success(`Sales Order ORD-${order.id} placed! Stock reserved from warehouse.`);
        this.showPlaceOrderModal = false;
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to place customer order.');
      }
    });
  }

  markShipped(ord: CustomerOrder) {
    this.api.markOrderShipped(ord.id).subscribe({
      next: () => {
        this.toast.info(`ORD-${ord.id} marked as SHIPPED.`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to mark order as shipped.');
      }
    });
  }

  markDelivered(ord: CustomerOrder) {
    this.api.markOrderDelivered(ord.id).subscribe({
      next: () => {
        this.toast.success(`ORD-${ord.id} marked as DELIVERED.`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to mark order as delivered.');
      }
    });
  }

  cancelOrder(ord: CustomerOrder) {
    if (!confirm(`Cancel order ORD-${ord.id}? This will restore reserved stock back into the warehouse.`)) return;

    this.api.cancelCustomerOrder(ord.id).subscribe({
      next: () => {
        this.toast.warning(`ORD-${ord.id} cancelled. Stock restored to warehouse.`);
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to cancel order.');
      }
    });
  }

  viewDetails(ord: CustomerOrder) {
    this.selectedOrder = ord;
    this.showDetailsModal = true;
  }
}
