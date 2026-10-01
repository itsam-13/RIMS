import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-layout" [attr.data-theme]="theme()">
      <!-- ICON DOCK SIDEBAR (Reference Image 2) -->
      <aside class="dock-sidebar">
        <!-- Top Illuminated Brand / Home Icon -->
        <div class="dock-top">
          <a routerLink="/dashboard" class="dock-brand-icon" title="RIMS Command Center">
            <i class="ri-home-4-fill"></i>
          </a>
        </div>

        <!-- Navigation Icon Stack -->
        <nav class="dock-nav">
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            class="dock-link"
            title="Command Center"
          >
            <i class="ri-layout-grid-fill"></i>
            <span class="dock-tooltip">Dashboard</span>
          </a>

          <a
            routerLink="/inventory"
            routerLinkActive="active"
            class="dock-link"
            title="Inventory Matrix"
          >
            <i class="ri-database-2-line"></i>
            <span class="dock-tooltip">Inventory</span>
          </a>

          <a
            routerLink="/products"
            routerLinkActive="active"
            class="dock-link"
            title="Product Catalog"
          >
            <i class="ri-folder-3-line"></i>
            <span class="dock-tooltip">Catalog</span>
          </a>

          <a
            routerLink="/warehouses"
            routerLinkActive="active"
            class="dock-link"
            title="Warehouses & Facilities"
          >
            <i class="ri-building-line"></i>
            <span class="dock-tooltip">Warehouses</span>
          </a>

          <a
            routerLink="/purchase-orders"
            routerLinkActive="active"
            class="dock-link"
            title="Purchase Orders"
          >
            <i class="ri-truck-line"></i>
            <span class="dock-tooltip">Purchase Orders</span>
          </a>

          <a
            routerLink="/customer-orders"
            routerLinkActive="active"
            class="dock-link"
            title="Customer Sales Orders"
          >
            <i class="ri-shopping-cart-2-line"></i>
            <span class="dock-tooltip">Customer Orders</span>
          </a>

          <a
            routerLink="/stock-movements"
            routerLinkActive="active"
            class="dock-link"
            title="Stock Movements & Transfers"
          >
            <i class="ri-line-chart-line"></i>
            <span class="dock-tooltip">Audit & Transfers</span>
          </a>

          <a
            routerLink="/suppliers"
            routerLinkActive="active"
            class="dock-link"
            title="Suppliers"
          >
            <i class="ri-community-line"></i>
            <span class="dock-tooltip">Suppliers</span>
          </a>

          <a
            *ngIf="authService.isAdmin()"
            routerLink="/users"
            routerLinkActive="active"
            class="dock-link"
            title="Operator Registry"
          >
            <i class="ri-settings-4-line"></i>
            <span class="dock-tooltip">System Users</span>
          </a>
        </nav>

        <!-- Bottom Controls (Theme & Profile Pill) -->
        <div class="dock-bottom">
          <!-- Light/Dark Toggle -->
          <button
            type="button"
            class="dock-theme-btn"
            (click)="toggleTheme()"
            [title]="theme() === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'"
          >
            <i [class]="theme() === 'dark' ? 'ri-sun-line' : 'ri-moon-line'"></i>
            <span class="theme-label">{{ theme() === 'dark' ? 'Light' : 'Dark' }}</span>
          </button>

          <!-- User Profile Pill -->
          <div class="dock-profile" (click)="authService.logout()" title="Click to Sign Out">
            <div class="profile-avatar">
              <i class="ri-user-fill"></i>
            </div>
            <span class="profile-name">{{ authService.currentUser()?.username || 'Operator' }}</span>
            <i class="ri-arrow-right-s-line profile-arrow"></i>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTAINER -->
      <div class="app-main">
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--bg-canvas);
    }

    /* Reference Image 2: Slim Icon Dock Sidebar */
    .dock-sidebar {
      width: 76px;
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.25rem 0.5rem;
      flex-shrink: 0;
      z-index: 100;
    }

    .dock-top {
      margin-bottom: 2rem;
    }

    .dock-brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #1d4d42 0%, #10342d 100%);
      border: 1px solid var(--c-mint-sage);
      box-shadow: 0 0 16px rgba(142, 182, 155, 0.35);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c-pale-mint);
      font-size: 1.35rem;
      transition: all var(--transition-fast);
    }
    .dock-brand-icon:hover {
      box-shadow: 0 0 22px rgba(142, 182, 155, 0.5);
      transform: scale(1.05);
    }

    .dock-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.1rem;
      width: 100%;
    }

    .dock-link {
      position: relative;
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 1.25rem;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .dock-link:hover {
      color: var(--c-pale-mint);
      background-color: rgba(142, 182, 155, 0.12);
    }

    .dock-link.active {
      color: var(--c-pale-mint);
      background: linear-gradient(135deg, rgba(35, 83, 71, 0.8) 0%, rgba(22, 56, 50, 0.9) 100%);
      border: 1px solid rgba(142, 182, 155, 0.4);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    }

    /* Hover Tooltip */
    .dock-tooltip {
      position: absolute;
      left: 56px;
      background: #0B2B26;
      border: 1px solid var(--border-strong);
      color: var(--c-pale-mint);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translateX(-6px);
      transition: all var(--transition-fast);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      z-index: 200;
    }

    .dock-link:hover .dock-tooltip {
      opacity: 1;
      transform: translateX(0);
    }

    .dock-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }

    .dock-theme-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      font-size: 1.15rem;
      transition: color var(--transition-fast);
    }
    .dock-theme-btn:hover {
      color: var(--c-pale-mint);
    }

    .theme-label {
      font-size: 0.65rem;
      font-weight: 500;
    }

    .dock-profile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
      padding: 0.35rem 0.2rem;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      width: 100%;
      text-align: center;
    }
    .dock-profile:hover {
      background-color: rgba(142, 182, 155, 0.1);
    }

    .profile-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #163832;
      border: 1px solid var(--c-mint-sage);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c-mint-sage);
      font-size: 1rem;
    }

    .profile-name {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .profile-arrow {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Main Content Area */
    .app-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100vh;
      overflow: hidden;
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 1.85rem;
    }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private router = inject(Router);

  theme = signal<'dark' | 'light'>('dark');
  currentTime = signal<string>('');
  private timer: any;

  ngOnInit() {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);

    const savedTheme = localStorage.getItem('rims_theme') as 'dark' | 'light';
    if (savedTheme) {
      this.theme.set(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  updateClock() {
    const now = new Date();
    this.currentTime.set(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('rims_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }
}
