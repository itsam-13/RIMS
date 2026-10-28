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
  templateUrl: './warehouses.component.html',
  styleUrl: './warehouses.component.css'
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
