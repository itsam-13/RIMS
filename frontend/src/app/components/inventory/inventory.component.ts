import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Inventory, Product, Warehouse, Category } from '../../models/inventory.models';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit, OnDestroy {
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
  searchTerm = signal<string>('');
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  page = signal<number>(1);
  pageSize = signal<number>(10);

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

    const q = this.searchTerm().toLowerCase().trim();
    if (q) {
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

  paginatedInventory = computed(() => {
    const list = this.filteredInventory();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.searchTerm.set(q);
      this.page.set(1);
    });
    this.loadData();
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  onSearchChange(text: string): void {
    this.searchQuery = text;
    this.searchSubject.next(text);
  }

  onFilterChange(): void {
    this.page.set(1);
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
