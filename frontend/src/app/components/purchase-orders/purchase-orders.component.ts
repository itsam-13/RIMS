import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PurchaseOrder, Supplier, Warehouse, Product, POStatus } from '../../models/inventory.models';
import { forkJoin } from 'rxjs';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.css'
})
export class PurchaseOrdersComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);

  loading = signal<boolean>(false);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([]);

  statusFilter = 'ALL';
  warehouseFilter: number | null = null;

  showCreateModal = false;

  poForm = new FormGroup({
    supplierId: new FormControl<number | null>(null, [Validators.required]),
    warehouseId: new FormControl<number | null>(null, [Validators.required]),
    items: new FormArray<FormGroup>([])
  });

  showDetailsModal = false;
  selectedPO: PurchaseOrder | null = null;
  private dataLoaded = false;
  private pendingCreateRequest: { productId?: number } | null = null;

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
    this.route.queryParams.subscribe(params => {
      if (params['reorderProductId']) {
        const prodId = Number(params['reorderProductId']);
        this.pendingCreateRequest = { productId: prodId };
      } else if (params['create'] === 'true') {
        this.pendingCreateRequest = {};
      }
      this.openRequestedCreateModal();
    });
    this.loadData();
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
        this.dataLoaded = true;
        this.openRequestedCreateModal();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load purchase orders.', 'Procurement Error');
      }
    });
  }

  private openRequestedCreateModal() {
    if (!this.dataLoaded || !this.pendingCreateRequest) return;
    const request = this.pendingCreateRequest;
    this.pendingCreateRequest = null;
    this.openCreateModal(request.productId);
  }

  calculatePOTotal(po: PurchaseOrder): number {
    if (!po.items) return 0;
    return po.items.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0);
  }

  get poItems(): FormArray<FormGroup> {
    return this.poForm.get('items') as FormArray<FormGroup>;
  }

  createPOItem(productId: number | null = null, quantity = 20, unitCost = 50): FormGroup {
    return new FormGroup({
      productId: new FormControl<number | null>(productId, { validators: [Validators.required] }),
      quantity: new FormControl<number>(quantity, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      unitCost: new FormControl<number>(unitCost, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
    });
  }

  calculateNewPOTotal(): number {
    return this.poItems.controls.reduce((acc, ctrl) => {
      const val = ctrl.value;
      return acc + ((val.quantity || 0) * (val.unitCost || 0));
    }, 0);
  }

  openCreateModal(preselectedProductId?: number) {
    const sId = this.suppliers().length > 0 ? this.suppliers()[0].id : null;
    const wId = this.warehouses().length > 0 ? this.warehouses()[0].id : null;
    const pId = preselectedProductId || (this.products().length > 0 ? this.products()[0].id : null);
    const cost = preselectedProductId
      ? (this.products().find(p => p.id === preselectedProductId)?.price || 50)
      : 50;

    this.poForm.reset({
      supplierId: sId,
      warehouseId: wId
    });
    this.poItems.clear();
    this.poItems.push(this.createPOItem(pId, 20, cost));
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    const params = this.route.snapshot.queryParamMap;
    if (!params.has('create') && !params.has('reorderProductId')) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { create: null, reorderProductId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  addLineItem() {
    const pId = this.products().length > 0 ? this.products()[0].id : null;
    this.poItems.push(this.createPOItem(pId, 10, 25));
  }

  removeItem(idx: number) {
    if (this.poItems.length > 1) {
      this.poItems.removeAt(idx);
    }
  }

  onProductSelect(idx: number) {
    const ctrl = this.poItems.at(idx);
    if (!ctrl) return;
    const pId = ctrl.get('productId')?.value;
    const found = this.products().find(p => p.id === pId);
    if (found) {
      ctrl.patchValue({ unitCost: found.price || 50 });
    }
  }

  isNewPOValid(): boolean {
    if (this.poForm.invalid || this.poItems.length === 0) return false;
    return this.poItems.controls.every(ctrl => {
      const val = ctrl.value;
      return !!val.productId && (val.quantity || 0) > 0 && (val.unitCost || 0) >= 0;
    });
  }

  submitPurchaseOrder() {
    if (!this.isNewPOValid()) {
      this.toast.error('Please complete all required fields and verify item quantities.');
      return;
    }

    const formVal = this.poForm.getRawValue();
    const payload = {
      supplierId: formVal.supplierId!,
      warehouseId: formVal.warehouseId!,
      status: 'PENDING' as POStatus,
      items: this.poItems.controls.map(ctrl => {
        const val = ctrl.value;
        return {
          productId: val.productId as number,
          quantity: val.quantity as number,
          unitCost: val.unitCost as number
        };
      })
    };

    this.api.createPurchaseOrder(payload).subscribe({
      next: (po) => {
        this.toast.success(`Purchase Order PO-${po.id} issued successfully.`);
        this.closeCreateModal();
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
