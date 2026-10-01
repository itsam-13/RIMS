import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { ShellComponent } from './components/shell/shell.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ProductsComponent } from './components/products/products.component';
import { WarehousesComponent } from './components/warehouses/warehouses.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { CustomerOrdersComponent } from './components/customer-orders/customer-orders.component';
import { StockMovementsComponent } from './components/stock-movements/stock-movements.component';
import { SuppliersComponent } from './components/suppliers/suppliers.component';
import { UsersComponent } from './components/users/users.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'warehouses', component: WarehousesComponent },
      { path: 'purchase-orders', component: PurchaseOrdersComponent },
      { path: 'customer-orders', component: CustomerOrdersComponent },
      { path: 'stock-movements', component: StockMovementsComponent },
      { path: 'suppliers', component: SuppliersComponent },
      { path: 'users', component: UsersComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
