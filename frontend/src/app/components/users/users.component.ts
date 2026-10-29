import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AssignableUserRole, User } from '../../models/inventory.models';

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
            <span>CREATE USER</span>
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
              <th>APPROVAL</th>
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
                    'badge-success': u.role === 'SALES',
                    'badge-warning': u.role === 'PENDING',
                    'badge-danger': u.role === 'SUPER_ADMIN'
                  }"
                >
                  <span class="badge-dot"></span>
                  {{ u.role }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="u.approved ? 'badge-success' : 'badge-warning'">
                  {{ u.approved ? 'APPROVED' : 'AWAITING APPROVAL' }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button
                    *ngIf="u.role !== 'SUPER_ADMIN'"
                    class="btn btn-secondary btn-sm"
                    (click)="setApproval(u, !u.approved)"
                  >{{ u.approved ? 'REVOKE' : 'APPROVE' }}</button>
                  <button *ngIf="u.role !== 'SUPER_ADMIN'" class="btn btn-secondary btn-sm" (click)="openEditModal(u)" title="Modify Permissions">
                    <i class="ri-edit-line"></i> EDIT
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    *ngIf="u.role !== 'SUPER_ADMIN'"
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

      <!-- MODAL: CREATE USER / ASSIGN ROLE -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <div>
              <div class="technical-label">{{ isCreating ? 'IDENTITY PROVISIONING' : 'ACCESS PERMISSIONS' }}</div>
              <div class="section-title">{{ isCreating ? 'Create user' : 'Assign role: ' + userForm.username }}</div>
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
                [readonly]="!isCreating"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">CORPORATE EMAIL</label>
              <input
                type="email"
                class="form-control"
                [(ngModel)]="userForm.email"
                [readonly]="!isCreating"
                required
              />
            </div>

            <div class="form-group" *ngIf="isCreating">
              <label class="form-label">PASSWORD</label>
              <input type="password" class="form-control input-mono" [(ngModel)]="userForm.password" required />
              <small>New accounts created here are approved immediately.</small>
            </div>

            <div class="form-group">
              <label class="form-label">ASSIGNED SECURITY ROLE</label>
              <select class="form-select" [(ngModel)]="userForm.role" required>
                <option value="ADMIN">ADMIN — Full operational access</option>
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
              [disabled]="!userForm.role"
            >
              {{ isCreating ? 'CREATE APPROVED USER' : 'UPDATE ROLE' }}
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

  loading = signal<boolean>(false);
  users = signal<User[]>([]);

  showModal = false;
  isCreating = false;
  editingId: number | null = null;
  userForm: { username: string; email: string; password: string; role: AssignableUserRole } = {
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
    this.isCreating = true;
    this.editingId = null;
    this.userForm = { username: '', email: '', password: '', role: 'SALES' };
    this.showModal = true;
  }

  openEditModal(u: User) {
    this.isCreating = false;
    this.editingId = u.id!;
    this.userForm = {
      username: u.username,
      email: u.email,
      password: '',
      role: u.role === 'PENDING' || u.role === 'SUPER_ADMIN' ? 'SALES' : u.role
    };
    this.showModal = true;
  }

  saveUser() {
    const request = this.isCreating
      ? this.api.createUser(this.userForm)
      : this.editingId
        ? this.api.assignUserRole(this.editingId, this.userForm.role)
        : null;
    if (!request) return;
    request.subscribe({
      next: () => {
        this.toast.success(this.isCreating
          ? `Approved account created for ${this.userForm.username}.`
          : `Role updated for ${this.userForm.username}.`);
        this.showModal = false;
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.error?.error || 'Failed to assign role.')
    });
  }

  setApproval(user: User, approved: boolean) {
    this.api.setUserApproval(user.id!, approved).subscribe({
      next: () => {
        this.toast.success(approved ? `Access approved for ${user.username}.` : `Access revoked for ${user.username}.`);
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.error?.error || 'Failed to update account approval.')
    });
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
