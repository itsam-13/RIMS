import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { approvalGuard } from './guards/approval.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./components/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'signup',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    canActivateChild: [approvalGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./components/inventory/inventory.component').then(
            (m) => m.InventoryComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./components/products/products.component').then(
            (m) => m.ProductsComponent
          ),
      },
      {
        path: 'warehouses',
        loadComponent: () =>
          import('./components/warehouses/warehouses.component').then(
            (m) => m.WarehousesComponent
          ),
      },
      {
        path: 'purchase-orders',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
        loadComponent: () =>
          import('./components/purchase-orders/purchase-orders.component').then(
            (m) => m.PurchaseOrdersComponent
          ),
      },
      {
        path: 'customer-orders',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SALES', 'WAREHOUSE_MANAGER'] },
        loadComponent: () =>
          import('./components/customer-orders/customer-orders.component').then(
            (m) => m.CustomerOrdersComponent
          ),
      },
      {
        path: 'stock-movements',
        loadComponent: () =>
          import('./components/stock-movements/stock-movements.component').then(
            (m) => m.StockMovementsComponent
          ),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./components/suppliers/suppliers.component').then(
            (m) => m.SuppliersComponent
          ),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./components/users/users.component').then(
            (m) => m.UsersComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
