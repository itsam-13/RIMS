import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserRole } from '../../models/inventory.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-container">
        <!-- Brand / Identity -->
        <div class="brand-header">
          <div class="brand-icon">
            <i class="ri-scan-2-line"></i>
          </div>
          <div>
            <div class="brand-badge">HCLTECH ENTERPRISE SYSTEM</div>
            <h1 class="brand-title">RIMS // PLATFORM</h1>
            <p class="brand-desc">Retail Inventory & Infrastructure Management</p>
          </div>
        </div>

        <!-- Mode Switcher Tabs -->
        <div class="tab-switcher">
          <button
            type="button"
            class="tab-btn"
            [class.active]="mode === 'login'"
            (click)="setMode('login')"
          >
            <i class="ri-shield-keyhole-line"></i> SYSTEM AUTHENTICATION
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="mode === 'register'"
            (click)="setMode('register')"
          >
            <i class="ri-user-add-line"></i> REGISTER USER
          </button>
        </div>

        <!-- LOGIN FORM -->
        <form *ngIf="mode === 'login'" (ngSubmit)="onLogin()" class="auth-form">
          <div class="form-group">
            <label class="form-label">OPERATOR IDENTIFIER (USERNAME)</label>
            <div class="input-with-icon">
              <i class="ri-user-3-line"></i>
              <input
                type="text"
                class="form-control input-mono"
                [(ngModel)]="loginData.username"
                name="username"
                placeholder="Enter operator username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">SECURITY CREDENTIAL (PASSWORD)</label>
            <div class="input-with-icon">
              <i class="ri-lock-line"></i>
              <input
                type="password"
                class="form-control input-mono"
                [(ngModel)]="loginData.password"
                name="password"
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            style="width: 100%; margin-top: 0.5rem;"
            [disabled]="loading"
          >
            <i class="ri-login-box-line" *ngIf="!loading"></i>
            <i class="ri-loader-4-line ri-spin" *ngIf="loading"></i>
            {{ loading ? 'AUTHENTICATING SECURE SESSION...' : 'ACCESS CONTROL TERMINAL' }}
          </button>

          <!-- Quick Test Credentials Drawer -->
          <div class="quick-credentials">
            <div class="quick-label">
              <i class="ri-flashlight-line"></i> QUICK ACCESS PROFILES:
            </div>
            <div class="quick-buttons">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                (click)="fillCredentials('admin', 'admin123')"
              >
                <span class="badge badge-purple" style="font-size: 0.65rem;">ADMIN</span>
                admin
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                (click)="fillCredentials('manager', 'password')"
              >
                <span class="badge badge-info" style="font-size: 0.65rem;">MANAGER</span>
                manager
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                (click)="fillCredentials('sales', 'password')"
              >
                <span class="badge badge-success" style="font-size: 0.65rem;">SALES</span>
                sales
              </button>
            </div>
          </div>
        </form>

        <!-- REGISTER FORM -->
        <form *ngIf="mode === 'register'" (ngSubmit)="onRegister()" class="auth-form">
          <div class="form-group">
            <label class="form-label">OPERATOR USERNAME</label>
            <input
              type="text"
              class="form-control input-mono"
              [(ngModel)]="registerData.username"
              name="regUsername"
              placeholder="e.g. operator_davis"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">CORPORATE EMAIL ADDRESS</label>
            <input
              type="email"
              class="form-control"
              [(ngModel)]="registerData.email"
              name="regEmail"
              placeholder="e.g. user@hcltech.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">PASSWORD</label>
            <input
              type="password"
              class="form-control input-mono"
              [(ngModel)]="registerData.password"
              name="regPassword"
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">ASSIGNED SECURITY ROLE</label>
            <select
              class="form-select"
              [(ngModel)]="registerData.role"
              name="regRole"
              required
            >
              <option value="ADMIN">ADMIN — Full System Master Rights</option>
              <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER — Inventory, Transfers & POs</option>
              <option value="SALES">SALES — Order Creation & Customer Orders</option>
            </select>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            style="width: 100%; margin-top: 0.5rem;"
            [disabled]="loading"
          >
            <i class="ri-user-add-line" *ngIf="!loading"></i>
            <i class="ri-loader-4-line ri-spin" *ngIf="loading"></i>
            {{ loading ? 'CREATING CREDENTIALS...' : 'PROVISION ACCOUNT' }}
          </button>
        </form>

        <!-- Technical Footer -->
        <div class="auth-footer">
          <span class="mono-text">PORT 8082 // REST API // STATELINK JWT SHA-256</span>
          <span class="status-indicator">
            <span class="status-dot"></span> OPERATIONAL
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 15%, #163832 0%, #0B2B26 40%, #051F20 90%);
      padding: 1.5rem;
    }

    .login-container {
      width: 100%;
      max-width: 460px;
      background: linear-gradient(145deg, rgba(22, 56, 50, 0.85) 0%, rgba(11, 43, 38, 0.95) 100%);
      border: 1px solid rgba(142, 182, 155, 0.22);
      border-radius: var(--radius-card);
      box-shadow: 0 24px 60px rgba(2, 12, 12, 0.75), inset 0 1px 0 rgba(218, 241, 222, 0.1);
      backdrop-filter: blur(16px);
      padding: 2.4rem;
      position: relative;
    }

    .login-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #38bdf8, #8EB69B, #DAF1DE);
      border-radius: var(--radius-card) var(--radius-card) 0 0;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      margin-bottom: 1.75rem;
    }

    .brand-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #1d4d42 0%, #10342d 100%);
      border: 1px solid var(--c-mint-sage);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c-pale-mint);
      font-size: 1.8rem;
      box-shadow: 0 0 16px rgba(142, 182, 155, 0.3);
    }

    .brand-badge {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      color: var(--accent-primary);
      font-weight: 600;
    }

    .brand-title {
      font-family: var(--font-mono);
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .brand-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .tab-switcher {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
      background-color: var(--bg-canvas);
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      padding: 0.55rem 0.6rem;
      border-radius: var(--radius-xs);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: all var(--transition-fast);
    }

    .tab-btn.active {
      background-color: var(--bg-card);
      color: var(--accent-primary);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-strong);
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-with-icon i {
      position: absolute;
      left: 0.85rem;
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .input-with-icon input {
      padding-left: 2.5rem;
    }

    .quick-credentials {
      margin-top: 1.6rem;
      padding-top: 1.25rem;
      border-top: 1px dashed var(--border-subtle);
    }

    .quick-label {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-bottom: 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .quick-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .quick-buttons .btn {
      font-family: var(--font-mono);
      font-size: 0.76rem;
      padding: 0.35rem 0.65rem;
    }

    .auth-footer {
      margin-top: 1.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .mono-text {
      font-family: var(--font-mono);
      font-size: 0.68rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-family: var(--font-mono);
      color: var(--color-success);
      font-weight: 600;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      background-color: var(--color-success);
      border-radius: 50%;
      box-shadow: 0 0 6px var(--color-success);
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  mode: 'login' | 'register' = 'login';
  loading = false;

  loginData = {
    username: 'admin',
    password: 'password'
  };

  registerData: { username: string; email: string; password: string; role: UserRole } = {
    username: '',
    email: '',
    password: '',
    role: 'SALES'
  };

  setMode(newMode: 'login' | 'register') {
    this.mode = newMode;
  }

  fillCredentials(user: string, pass: string) {
    this.loginData.username = user;
    this.loginData.password = pass;
  }

  onLogin() {
    if (!this.loginData.username || !this.loginData.password) {
      this.toastService.warning('Please enter both operator ID and password.');
      return;
    }

    this.loading = true;
    this.authService.login(this.loginData).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success(`Welcome, ${res.username} [${res.role}]`, 'Authentication Successful');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.error || err.error || 'Authentication rejected. Verify credentials.';
        this.toastService.error(msg, 'Access Denied');
      }
    });
  }

  onRegister() {
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.toastService.warning('All registration fields are required.');
      return;
    }

    this.loading = true;
    this.authService.register(this.registerData).subscribe({
      next: (user) => {
        this.loading = false;
        this.toastService.success(`Account for ${user.username} created. You can now authenticate.`, 'Registration Complete');
        this.loginData.username = user.username;
        this.loginData.password = this.registerData.password;
        this.mode = 'login';
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.error || err.error || 'Registration failed. Check if username/email already exists.';
        this.toastService.error(msg, 'Provisioning Error');
      }
    });
  }
}
