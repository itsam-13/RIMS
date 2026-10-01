import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Supplier } from '../../models/inventory.models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="suppliers-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="technical-label">PROCUREMENT VENDOR NETWORK</div>
          <h1 class="page-title">Registered Suppliers & Lead Times</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadSuppliers()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">
            <i class="ri-add-line"></i>
            <span>REGISTER NEW SUPPLIER</span>
          </button>
        </div>
      </div>

      <!-- Suppliers Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>SUPPLIER / VENDOR NAME</th>
              <th>CONTACT EMAIL</th>
              <th>PHONE</th>
              <th>AVERAGE LEAD TIME</th>
              <th style="text-align: right;">OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="suppliers().length === 0">
              <td colspan="6" class="empty-state">
                <i class="ri-community-line"></i>
                <div>No suppliers registered yet.</div>
              </td>
            </tr>
            <tr *ngFor="let s of suppliers()">
              <td class="mono text-muted">#{{ s.id }}</td>
              <td style="font-weight: 600;">{{ s.name }}</td>
              <td>
                <a [href]="'mailto:' + s.contactEmail" style="color: var(--accent-primary);">
                  <i class="ri-mail-line"></i> {{ s.contactEmail }}
                </a>
              </td>
              <td class="mono">{{ s.phone }}</td>
              <td>
                <span class="badge badge-neutral">
                  <i class="ri-time-line"></i> {{ s.leadTimeDays }} Days
                </span>
              </td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(s)" title="Edit Supplier">
                    <i class="ri-edit-line"></i> EDIT
                  </button>
                  <button
                    *ngIf="authService.isAdmin()"
                    class="btn btn-danger btn-sm"
                    (click)="deleteSupplier(s)"
                    title="Delete Supplier (Admin only)"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL: CREATE / EDIT SUPPLIER -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">{{ isEditing ? 'UPDATE VENDOR RECORD' : 'VENDOR ONBOARDING' }}</div>
              <div class="section-title">{{ isEditing ? 'Edit: ' + supplierForm.name : 'Register Supplier' }}</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">SUPPLIER / COMPANY NAME</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="supplierForm.name"
                placeholder="e.g. Continental Electronics Corp."
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">CONTACT EMAIL ADDRESS</label>
              <input
                type="email"
                class="form-control"
                [(ngModel)]="supplierForm.contactEmail"
                placeholder="procurement@vendor.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">PHONE NUMBER</label>
              <input
                type="text"
                class="form-control input-mono"
                [(ngModel)]="supplierForm.phone"
                placeholder="+1 555-0199"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">AVERAGE LEAD TIME (CALENDAR DAYS)</label>
              <input
                type="number"
                class="form-control input-mono"
                [(ngModel)]="supplierForm.leadTimeDays"
                min="1"
                placeholder="7"
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="saveSupplier()"
              [disabled]="!supplierForm.name || !supplierForm.contactEmail || supplierForm.leadTimeDays <= 0"
            >
              {{ isEditing ? 'UPDATE SUPPLIER' : 'REGISTER SUPPLIER' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .suppliers-page {
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

    .action-btn-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
    }
  `]
})
export class SuppliersComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  loading = signal<boolean>(false);
  suppliers = signal<Supplier[]>([]);

  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  supplierForm = {
    name: '',
    contactEmail: '',
    phone: '',
    leadTimeDays: 7
  };

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading.set(true);
    this.api.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load supplier directory.');
      }
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.supplierForm = {
      name: '',
      contactEmail: '',
      phone: '',
      leadTimeDays: 7
    };
    this.showModal = true;
  }

  openEditModal(s: Supplier) {
    this.isEditing = true;
    this.editingId = s.id;
    this.supplierForm = {
      name: s.name,
      contactEmail: s.contactEmail,
      phone: s.phone,
      leadTimeDays: s.leadTimeDays
    };
    this.showModal = true;
  }

  saveSupplier() {
    const payload: Partial<Supplier> = {
      name: this.supplierForm.name,
      contactEmail: this.supplierForm.contactEmail,
      phone: this.supplierForm.phone,
      leadTimeDays: this.supplierForm.leadTimeDays
    };

    if (this.isEditing && this.editingId) {
      this.api.updateSupplier(this.editingId, payload).subscribe({
        next: () => {
          this.toast.success('Supplier profile updated.');
          this.showModal = false;
          this.loadSuppliers();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to update supplier.');
        }
      });
    } else {
      this.api.createSupplier(payload).subscribe({
        next: () => {
          this.toast.success('Supplier registered.');
          this.showModal = false;
          this.loadSuppliers();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to register supplier.');
        }
      });
    }
  }

  deleteSupplier(s: Supplier) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;

    this.api.deleteSupplier(s.id).subscribe({
      next: () => {
        this.toast.success('Supplier removed.');
        this.loadSuppliers();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to delete supplier.');
      }
    });
  }
}
