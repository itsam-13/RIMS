import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InventoryApiService } from '../../services/inventory-api.service';
import { AuthService } from '../../services/auth.service';
import {
  Inventory,
  Product,
  PurchaseOrder,
  StockMovement
} from '../../models/inventory.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private api = inject(InventoryApiService);

  readonly today = new Date();
  readonly greeting = this.getGreeting();
  readonly loadingRows = [0, 1, 2, 3];

  loading = signal(false);
  error = signal('');
  products = signal<Product[]>([]);
  inventory = signal<Inventory[]>([]);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  stockMovements = signal<StockMovement[]>([]);
  lastUpdated = signal<Date | null>(null);

  totalUnits = computed(() =>
    this.inventory().reduce((sum, row) => sum + (row.quantity || 0), 0)
  );

  lowStockProducts = computed(() => {
    const quantities = new Map<number, number>();
    for (const row of this.inventory()) {
      const productId = row.product?.id ?? row.productId;
      if (productId !== undefined) {
        quantities.set(productId, (quantities.get(productId) ?? 0) + (row.quantity || 0));
      }
    }

    return this.products()
      .map(product => ({ ...product, totalStock: quantities.get(product.id) ?? 0 }))
      .filter(product => product.totalStock <= product.reorderLevel)
      .sort((a, b) => (a.totalStock ?? 0) - (b.totalStock ?? 0));
  });

  openPurchaseOrders = computed(() =>
    this.purchaseOrders()
      .filter(order => order.status === 'PENDING' || order.status === 'ORDERED')
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
  );

  movements = computed(() =>
    [...this.stockMovements()]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  );

  ngOnInit() {
    this.loadAllData();
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  loadAllData() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      products: this.api.getProducts(),
      inventory: this.api.getInventory(),
      purchaseOrders: this.api.getPurchaseOrders(),
      stockMovements: this.api.getStockMovements()
    }).subscribe({
      next: (data) => {
        this.products.set(data.products);
        this.inventory.set(data.inventory);
        this.purchaseOrders.set(data.purchaseOrders);
        this.stockMovements.set(data.stockMovements);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The overview could not be loaded. Check your connection and try again.');
        this.loading.set(false);
      }
    });
  }
}
