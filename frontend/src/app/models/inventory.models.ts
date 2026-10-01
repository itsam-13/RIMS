export type UserRole = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'SALES';

export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: UserRole;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  reorderLevel: number;
  category?: Category;
  categoryId?: number;
  // Computed / UI helper
  totalStock?: number;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  // Computed / UI helper
  currentOccupancy?: number;
  fillPercentage?: number;
}

export interface Inventory {
  id: number;
  product: Product;
  warehouse: Warehouse;
  quantity: number;
  productId?: number;
  warehouseId?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactEmail: string;
  phone: string;
  leadTimeDays: number;
}

export type POStatus = 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id?: number;
  product?: Product;
  productId?: number;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: number;
  supplier?: Supplier;
  supplierId?: number;
  warehouse?: Warehouse;
  warehouseId?: number;
  status: POStatus;
  orderDate: string;
  items: PurchaseOrderItem[];
  totalCost?: number;
}

export type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id?: number;
  product?: Product;
  productId?: number;
  quantity: number;
  unitPrice: number;
}

export interface CustomerOrder {
  id: number;
  customerName: string;
  status: OrderStatus;
  orderDate: string;
  warehouse?: Warehouse;
  warehouseId?: number;
  user?: User;
  userId?: number;
  items: OrderItem[];
  totalAmount?: number;
}

export type MovementType = 'IN' | 'OUT' | 'TRANSFER';

export interface StockMovement {
  id: number;
  product: Product;
  productId?: number;
  fromWarehouse?: Warehouse;
  fromWarehouseId?: number;
  toWarehouse?: Warehouse;
  toWarehouseId?: number;
  quantity: number;
  type: MovementType;
  timestamp: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}
