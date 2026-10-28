import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
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
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './customer-orders.component.html',
  styleUrl: './customer-orders.component.css'
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

  orderForm = new FormGroup({
    customerName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    warehouseId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    items: new FormArray<FormGroup>([])
  });

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

  get orderItems(): FormArray<FormGroup> {
    return this.orderForm.get('items') as FormArray<FormGroup>;
  }

  createOrderItem(productId: number | null = null, quantity = 1, unitPrice = 100): FormGroup {
    return new FormGroup({
      productId: new FormControl<number | null>(productId, { validators: [Validators.required] }),
      quantity: new FormControl<number>(quantity, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      unitPrice: new FormControl<number>(unitPrice, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
    });
  }

  calculateNewOrderTotal(): number {
    return this.orderItems.controls.reduce((acc, ctrl) => {
      const val = ctrl.value;
      return acc + ((val.quantity || 0) * (val.unitPrice || 0));
    }, 0);
  }

  getAvailableStock(productId?: number | null, warehouseId?: number | null): number {
    if (!productId || !warehouseId) return 0;
    const item = this.inventory().find(i =>
      ((i.product?.id === productId) || (i.productId === productId)) &&
      ((i.warehouse?.id === warehouseId) || (i.warehouseId === warehouseId))
    );
    return item ? item.quantity : 0;
  }

  getItemAvailableStock(idx: number): number {
    const ctrl = this.orderItems.at(idx);
    if (!ctrl) return 0;
    const pId = ctrl.get('productId')?.value;
    const wId = this.orderForm.get('warehouseId')?.value;
    return this.getAvailableStock(pId, wId);
  }

  isItemStockInsufficient(idx: number): boolean {
    const ctrl = this.orderItems.at(idx);
    if (!ctrl) return false;
    const pId = ctrl.get('productId')?.value;
    const qty = ctrl.get('quantity')?.value || 0;
    const wId = this.orderForm.get('warehouseId')?.value;
    if (!pId || !wId) return false;
    return this.getAvailableStock(pId, wId) < qty;
  }

  openPlaceOrderModal() {
    const wId = this.warehouses().length > 0 ? this.warehouses()[0].id : null;
    const pId = this.products().length > 0 ? this.products()[0].id : null;
    const price = this.products().length > 0 ? (this.products()[0].price || 100) : 100;

    this.orderForm.reset({
      customerName: '',
      warehouseId: wId
    });
    this.orderItems.clear();
    this.orderItems.push(this.createOrderItem(pId, 1, price));
    this.showPlaceOrderModal = true;
  }

  addLineItem() {
    const pId = this.products().length > 0 ? this.products()[0].id : null;
    const price = this.products().length > 0 ? (this.products()[0].price || 100) : 100;
    this.orderItems.push(this.createOrderItem(pId, 1, price));
  }

  removeItem(idx: number) {
    if (this.orderItems.length > 1) {
      this.orderItems.removeAt(idx);
    }
  }

  onWarehouseChange() {
    // triggers UI update of available stock
  }

  onProductSelect(idx: number) {
    const ctrl = this.orderItems.at(idx);
    if (!ctrl) return;
    const pId = ctrl.get('productId')?.value;
    const found = this.products().find(p => p.id === pId);
    if (found) {
      ctrl.patchValue({ unitPrice: found.price || 100 });
    }
  }

  isNewOrderValid(): boolean {
    if (this.orderForm.invalid || this.orderItems.length === 0) return false;
    const wId = this.orderForm.get('warehouseId')?.value;
    if (!wId) return false;
    return this.orderItems.controls.every(ctrl => {
      const val = ctrl.value;
      if (!val.productId || (val.quantity || 0) <= 0 || (val.unitPrice || 0) < 0) return false;
      const available = this.getAvailableStock(val.productId, wId);
      return available >= val.quantity;
    });
  }

  submitCustomerOrder() {
    if (!this.isNewOrderValid()) {
      this.toast.error('Cannot place order: Please verify required fields and ensure quantities do not exceed available warehouse stock.');
      return;
    }

    const formVal = this.orderForm.getRawValue();
    const payload = {
      customerName: formVal.customerName.trim(),
      warehouseId: formVal.warehouseId!,
      status: 'PLACED' as OrderStatus,
      items: this.orderItems.controls.map(ctrl => {
        const val = ctrl.value;
        return {
          productId: val.productId as number,
          quantity: val.quantity as number,
          unitPrice: val.unitPrice as number
        };
      })
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
