import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/inventory.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="technical-label">SECURITY & ACCESS CONTROL</div>
          <h1 class="page-title">Operator Directory & Role Permissions</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadUsers()" [disabled]="loading()">
            <i class="ri-refresh-line" [class.ri-spin]="loading()"></i>
            <span>SYNC</span>
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">
            <i class="ri-user-add-line"></i>
            <span>PROVISION NEW OPERATOR</span>
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>OPERATOR ID</th>
              <th>USERNAME</th>
              <th>CORPORATE EMAIL</th>
              <th>ACCESS ROLE</th>
              <th style="text-align: right;">OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users()">
              <td class="mono text-muted">#{{ u.id }}</td>
              <td style="font-weight: 600;">
                <i class="ri-user-3-line" style="margin-right: 0.35rem; color: var(--accent-primary);"></i>
                {{ u.username }}
              </td>
              <td>{{ u.email }}</td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-purple': u.role === 'ADMIN',
                    'badge-info': u.role === 'WAREHOUSE_MANAGER',
                    'badge-success': u.role === 'SALES'
                  }"
                >
                  <span class="badge-dot"></span>
                  {{ u.role }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button class="btn btn-secondary btn-sm" (click)="openEditModal(u)" title="Modify Permissions">
                    <i class="ri-edit-line"></i> EDIT
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    (click)="deleteUser(u)"
                    title="Revoke & Delete Access"
                  >
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL: PROVISION / EDIT USER -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">{{ isEditing ? 'UPDATE ACCESS PERMISSIONS' : 'IDENTITY PROVISIONING' }}</div>
              <div class="section-title">{{ isEditing ? 'Edit: ' + userForm.username : 'Create Operator Account' }}</div>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="showModal = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">OPERATOR USERNAME</label>
              <input
                type="text"
                class="form-control input-mono"
                [(ngModel)]="userForm.username"
                placeholder="e.g. operator_smith"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">CORPORATE EMAIL</label>
              <input
                type="email"
                class="form-control"
                [(ngModel)]="userForm.email"
                placeholder="user@hcltech.com"
                required
              />
            </div>

            <div class="form-group" *ngIf="!isEditing">
              <label class="form-label">PASSWORD</label>
              <input
                type="password"
                class="form-control input-mono"
                [(ngModel)]="userForm.password"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">ASSIGNED SECURITY ROLE</label>
              <select class="form-select" [(ngModel)]="userForm.role" required>
                <option value="ADMIN">ADMIN — Master Root Access</option>
                <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER — Inventory, Transfers & POs</option>
                <option value="SALES">SALES — Order Creation & Customer Orders</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal = false">CANCEL</button>
            <button
              class="btn btn-primary"
              (click)="saveUser()"
              [disabled]="!userForm.username || !userForm.email || (!isEditing && !userForm.password)"
            >
              {{ isEditing ? 'UPDATE PERMISSIONS' : 'PROVISION ACCOUNT' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-page {
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
export class UsersComponent implements OnInit {
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  loading = signal<boolean>(false);
  users = signal<User[]>([]);

  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  userForm: { username: string; email: string; password?: string; role: UserRole } = {
    username: '',
    email: '',
    password: '',
    role: 'SALES'
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (data) => {
        this.users.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load user directory.', 'RBAC Error');
      }
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.userForm = {
      username: '',
      email: '',
      password: '',
      role: 'SALES'
    };
    this.showModal = true;
  }

  openEditModal(u: User) {
    this.isEditing = true;
    this.editingId = u.id!;
    this.userForm = {
      username: u.username,
      email: u.email,
      role: u.role
    };
    this.showModal = true;
  }

  saveUser() {
    if (this.isEditing && this.editingId) {
      this.api.updateUser(this.editingId, {
        username: this.userForm.username,
        email: this.userForm.email,
        role: this.userForm.role
      }).subscribe({
        next: () => {
          this.toast.success('User updated.');
          this.showModal = false;
          this.loadUsers();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to update user.');
        }
      });
    } else {
      this.authService.register({
        username: this.userForm.username,
        email: this.userForm.email,
        password: this.userForm.password,
        role: this.userForm.role
      }).subscribe({
        next: (u) => {
          this.toast.success(`Operator ${u.username} provisioned.`);
          this.showModal = false;
          this.loadUsers();
        },
        error: (err) => {
          this.toast.error(err.error?.error || 'Failed to provision account.');
        }
      });
    }
  }

  deleteUser(u: User) {
    if (!confirm(`Revoke and delete account for "${u.username}"?`)) return;

    this.api.deleteUser(u.id!).subscribe({
      next: () => {
        this.toast.success('Account revoked.');
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err.error?.error || 'Failed to delete user.');
      }
    });
  }
}
