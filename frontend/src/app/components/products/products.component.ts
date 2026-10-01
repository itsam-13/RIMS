import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Product, Category } from '../../models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="technical-label">MASTER PRODUCT CATALOG</div>
          <h1 class="page-title">Catalog & Category Management</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadData()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-secondary btn-sm" (click)="showCategoryDrawer = true">
            <i class="ri-folder-settings-line"></i>
            <span>MANAGE CATEGORIES ({{ categories().length }})</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">
            <i class="ri-add-line"></i>
            <span>REGISTER NEW PRODUCT</span>
          </button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="filter-panel panel">
        <div class="filter-row">
          <div class="search-box">
            <i class="ri-search-line"></i>
            <input
              type="text"
              class="form-control input-mono"
              [(ngModel)]="searchQuery"
              placeholder="Search catalog by SKU or title..."
            />
          </div>
          <div class="category-filter-box">
            <select class="form-select" [(ngModel)]="selectedCategoryId">
              <option [ngValue]="null">ALL CATEGORIES</option>
              <option *ngFor="let c of categories()" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>PRODUCT NAME</th>
              <th>CATEGORY</th>
              <th>UNIT PRICE</th>
              <th>REORDER THRESHOLD</th>
              <th style="text-align: right;">OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredProducts().length === 0">
              <td colspan="7" class="empty-state">
                <i class="ri-box-3-line"></i>
                <div>No products found matching query.</div>
              </td>
            </tr>
            <tr *ngFor="let p of filteredProducts()">
              <td class="mono text-muted">#{{ p.id }}</td>
              <td class="mono font-bold" style="color: var(--accent-primary);">{{ p.sku }}</td>
              <td style="font-weight: 600;">{{ p.name }}</td>
              <td>
                <span class="badge badge-neutral">
                  {{ p.category?.name || 'Unassigned' }}
                </span>
              </td>
              <td class="mono" style="font-weight: 600;">
                \${{ p.price | number:'1.2-2' }}
              </td>
              <td class="mono text-muted">
                {{ p.reorderLevel }} units
              </td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button
                    class="btn btn-secondary btn-sm"
                    (click)="openEditModal(p)"
                    title="Edit product"
                  >
                    <i class="ri-edit-line"></i> EDIT
                  </button>
                  <button
                    *ngIf="authService.isAdmin()"
                    class="btn btn-danger btn-sm"
                    (click)="deleteProduct(p)"
                    title="Delete product (Admin only)"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL: CREATE / EDIT PRODUCT -->
      <div class="modal-backdrop" *ngIf="showProductModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">{{ isEditing ? 'UPDATE MASTER RECORD' : 'CATALOG REGISTRATION' }}</div>
              <div class="section-title">{{ isEditing ? 'Edit Product: ' + productForm.name : 'Create New Product' }}</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showProductModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">PRODUCT TITLE / NAME</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="productForm.name"
                placeholder="e.g. Industrial Barcode Scanner Pro"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">SKU (STOCK KEEPING UNIT)</label>
              <input
                type="text"
                class="form-control input-mono"
                [(ngModel)]="productForm.sku"
                placeholder="e.g. SKU-SCN-2026"
                required
              />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">UNIT PRICE ($ USD)</label>
                <input
                  type="number"
                  class="form-control input-mono"
                  [(ngModel)]="productForm.price"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">REORDER LEVEL (UNITS)</label>
                <input
                  type="number"
                  class="form-control input-mono"
                  [(ngModel)]="productForm.reorderLevel"
                  min="0"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">PRODUCT CATEGORY</label>
              <select class="form-select" [(ngModel)]="productForm.categoryId">
                <option [ngValue]="null">-- Select Category --</option>
                <option *ngFor="let c of categories()" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showProductModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="saveProduct()"
              [disabled]="!productForm.name || !productForm.sku || productForm.price < 0"
            >
              {{ isEditing ? 'UPDATE PRODUCT' : 'CREATE PRODUCT' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL / DRAWER: CATEGORY MANAGEMENT -->
      <div class="modal-backdrop" *ngIf="showCategoryDrawer">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">CATEGORY TAXONOMY</div>
              <div class="section-title">Manage Product Categories</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showCategoryDrawer = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <!-- Add Category Inline Form -->
            <div class="add-cat-box">
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newCategoryName"
                placeholder="New category name (e.g. Hardware, Peripherals)..."
              />
              <button
                class="btn btn-primary"
                (click)="createCategory()"
                [disabled]="!newCategoryName.trim()"
              >
                <i class="ri-add-line"></i> ADD
              </button>
            </div>

            <!-- Categories List -->
            <div class="cat-list">
              <div *ngFor="let cat of categories()" class="cat-item">
                <span class="cat-title">{{ cat.name }}</span>
                <div class="cat-actions">
                  <button
                    *ngIf="authService.isAdmin()"
                    class="btn btn-danger btn-sm"
                    (click)="deleteCategory(cat)"
                    title="Delete Category"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCategoryDrawer = false">DONE</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .products-page {
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

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-box {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .search-box i {
      position: absolute;
      left: 0.75rem;
      color: var(--text-muted);
    }

    .search-box input {
      padding-left: 2.2rem;
    }

    .category-filter-box {
      min-width: 200px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
    }

    .add-cat-box {
      display: flex;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
    }

    .cat-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 280px;
      overflow-y: auto;
    }

    .cat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.85rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }

    .cat-title {
      font-weight: 500;
      color: var(--text-primary);
    }
  `]
})
export class ProductsComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  loading = signal<boolean>(false);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  searchQuery = '';
  selectedCategoryId: number | null = null;

  showProductModal = false;
  isEditing = false;
  editingId: number | null = null;
  productForm = {
    name: '',
    sku: '',
    price: 0,
    reorderLevel: 5,
    categoryId: null as number | null
  };

  showCategoryDrawer = false;
  newCategoryName = '';

  filteredProducts = computed(() => {
    let list = this.products();

    if (this.selectedCategoryId) {
      list = list.filter(p => (p.category?.id === this.selectedCategoryId) || (p.categoryId === this.selectedCategoryId));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      products: this.api.getProducts(),
      categories: this.api.getCategories()
    }).subscribe({
      next: (res) => {
        this.products.set(res.products || []);
        this.categories.set(res.categories || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load product catalog.', 'Catalog Error');
      }
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.productForm = {
      name: '',
      sku: 'SKU-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      price: 99.99,
      reorderLevel: 10,
      categoryId: this.categories().length > 0 ? this.categories()[0].id : null
    };
    this.showProductModal = true;
  }

  openEditModal(p: Product) {
    this.isEditing = true;
    this.editingId = p.id;
    this.productForm = {
      name: p.name,
      sku: p.sku,
      price: p.price,
      reorderLevel: p.reorderLevel,
      categoryId: p.category?.id || p.categoryId || null
    };
    this.showProductModal = true;
  }

  saveProduct() {
    const payload: Partial<Product> = {
      name: this.productForm.name,
      sku: this.productForm.sku,
      price: this.productForm.price,
      reorderLevel: this.productForm.reorderLevel,
      categoryId: this.productForm.categoryId || undefined
    };

    if (this.isEditing && this.editingId) {
      this.api.updateProduct(this.editingId, payload).subscribe({
        next: () => {
          this.toast.success('Product updated successfully.');
          this.showProductModal = false;
          this.loadData();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to update product.');
        }
      });
    } else {
      this.api.createProduct(payload).subscribe({
        next: () => {
          this.toast.success('Product created successfully.');
          this.showProductModal = false;
          this.loadData();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to create product.');
        }
      });
    }
  }

  deleteProduct(p: Product) {
    if (!confirm(`Are you sure you want to permanently delete product "${p.name}" (${p.sku})?`)) return;

    this.api.deleteProduct(p.id).subscribe({
      next: () => {
        this.toast.success('Product deleted.');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to delete product.');
      }
    });
  }

  createCategory() {
    if (!this.newCategoryName.trim()) return;

    this.api.createCategory({ name: this.newCategoryName.trim() }).subscribe({
      next: () => {
        this.toast.success(`Category "${this.newCategoryName}" created.`);
        this.newCategoryName = '';
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to create category.');
      }
    });
  }

  deleteCategory(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;

    this.api.deleteCategory(cat.id).subscribe({
      next: () => {
        this.toast.success('Category removed.');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to delete category.');
      }
    });
  }
}
