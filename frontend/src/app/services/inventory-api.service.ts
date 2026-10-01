import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Category,
  Product,
  Warehouse,
  Inventory,
  Supplier,
  PurchaseOrder,
  CustomerOrder,
  StockMovement,
  User
} from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // ----------------------------------------------------
  // Categories
  // ----------------------------------------------------
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/categories/${id}`);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  // ----------------------------------------------------
  // Products
  // ----------------------------------------------------
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  // ----------------------------------------------------
  // Warehouses
  // ----------------------------------------------------
  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${this.baseUrl}/warehouses`);
  }

  getWarehouse(id: number): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.baseUrl}/warehouses/${id}`);
  }

  createWarehouse(warehouse: Partial<Warehouse>): Observable<Warehouse> {
    return this.http.post<Warehouse>(`${this.baseUrl}/warehouses`, warehouse);
  }

  updateWarehouse(id: number, warehouse: Partial<Warehouse>): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.baseUrl}/warehouses/${id}`, warehouse);
  }

  deleteWarehouse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/warehouses/${id}`);
  }

  // ----------------------------------------------------
  // Inventory
  // ----------------------------------------------------
  getInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.baseUrl}/inventory`);
  }

  getInventoryByWarehouse(warehouseId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.baseUrl}/inventory/warehouse/${warehouseId}`);
  }

  getInventoryByProduct(productId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.baseUrl}/inventory/product/${productId}`);
  }

  createInventory(payload: { productId: number; warehouseId: number; quantity: number }): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/inventory`, payload);
  }

  updateInventoryQuantity(id: number, quantity: number): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.baseUrl}/inventory/${id}`, { quantity });
  }

  adjustInventory(productId: number, warehouseId: number, delta: number): Observable<Inventory> {
    const params = new HttpParams()
      .set('productId', productId.toString())
      .set('warehouseId', warehouseId.toString());
    return this.http.patch<Inventory>(`${this.baseUrl}/inventory/adjust`, { delta }, { params });
  }

  deleteInventory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/inventory/${id}`);
  }

  // ----------------------------------------------------
  // Suppliers
  // ----------------------------------------------------
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.baseUrl}/suppliers`);
  }

  getSupplier(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/suppliers/${id}`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.baseUrl}/suppliers`, supplier);
  }

  updateSupplier(id: number, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/suppliers/${id}`);
  }

  // ----------------------------------------------------
  // Purchase Orders
  // ----------------------------------------------------
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${this.baseUrl}/purchase-orders`);
  }

  getPurchaseOrdersBySupplier(supplierId: number): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${this.baseUrl}/purchase-orders/supplier/${supplierId}`);
  }

  getPurchaseOrder(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}`);
  }

  createPurchaseOrder(po: any): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/purchase-orders`, po);
  }

  markPOOrdered(id: number): Observable<PurchaseOrder> {
    return this.http.patch<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}/mark-ordered`, {});
  }

  markPOReceived(id: number): Observable<PurchaseOrder> {
    return this.http.patch<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}/mark-received`, {});
  }

  cancelPO(id: number): Observable<PurchaseOrder> {
    return this.http.patch<PurchaseOrder>(`${this.baseUrl}/purchase-orders/${id}/cancel`, {});
  }

  // ----------------------------------------------------
  // Customer Orders (Sales)
  // ----------------------------------------------------
  getCustomerOrders(): Observable<CustomerOrder[]> {
    return this.http.get<CustomerOrder[]>(`${this.baseUrl}/orders`);
  }

  getCustomerOrdersByWarehouse(warehouseId: number): Observable<CustomerOrder[]> {
    return this.http.get<CustomerOrder[]>(`${this.baseUrl}/orders/warehouse/${warehouseId}`);
  }

  getCustomerOrder(id: number): Observable<CustomerOrder> {
    return this.http.get<CustomerOrder>(`${this.baseUrl}/orders/${id}`);
  }

  placeCustomerOrder(order: any): Observable<CustomerOrder> {
    return this.http.post<CustomerOrder>(`${this.baseUrl}/orders`, order);
  }

  markOrderShipped(id: number): Observable<CustomerOrder> {
    return this.http.patch<CustomerOrder>(`${this.baseUrl}/orders/${id}/mark-shipped`, {});
  }

  markOrderDelivered(id: number): Observable<CustomerOrder> {
    return this.http.patch<CustomerOrder>(`${this.baseUrl}/orders/${id}/mark-delivered`, {});
  }

  cancelCustomerOrder(id: number): Observable<CustomerOrder> {
    return this.http.patch<CustomerOrder>(`${this.baseUrl}/orders/${id}/cancel`, {});
  }

  // ----------------------------------------------------
  // Stock Movements (Audit Trail & Inter-Warehouse Transfers)
  // ----------------------------------------------------
  getStockMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.baseUrl}/stock-movements`);
  }

  getStockMovementsByProduct(productId: number): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.baseUrl}/stock-movements/product/${productId}`);
  }

  recordStockMovement(movement: any): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${this.baseUrl}/stock-movements`, movement);
  }

  // ----------------------------------------------------
  // Users (Admin RBAC)
  // ----------------------------------------------------
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }
}
