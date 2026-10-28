import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryApiService } from './inventory-api.service';
import { Category, Product, Warehouse, Inventory, CustomerOrder, PurchaseOrder, Supplier } from '../models/inventory.models';

describe('InventoryApiService', () => {
  let service: InventoryApiService;
  let httpMock: HttpTestingController;

  const mockWarehouse: Warehouse = {
    id: 1,
    name: 'Main Depot',
    location: 'Austin, TX',
    capacity: 50000
  };

  const mockSupplier: Supplier = {
    id: 1,
    name: 'Global Tech',
    contactEmail: 'contact@globaltech.com',
    phone: '+1-555-0199',
    leadTimeDays: 7
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(InventoryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch categories via GET /api/categories', () => {
    const mockCategories: Category[] = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Apparel' }
    ];

    service.getCategories().subscribe(res => {
      expect(res).toEqual(mockCategories);
    });

    const req = httpMock.expectOne('/api/categories');
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('should create product via POST /api/products', () => {
    const newProduct: Partial<Product> = {
      name: 'Wireless Mouse',
      sku: 'SKU-MOUSE-1',
      price: 29.99,
      reorderLevel: 10
    };
    const createdProduct: Product = { id: 101, ...newProduct } as Product;

    service.createProduct(newProduct).subscribe(res => {
      expect(res).toEqual(createdProduct);
    });

    const req = httpMock.expectOne('/api/products');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProduct);
    req.flush(createdProduct);
  });

  it('should fetch warehouses via GET /api/warehouses', () => {
    const mockWarehouses: Warehouse[] = [mockWarehouse];

    service.getWarehouses().subscribe(res => {
      expect(res).toEqual(mockWarehouses);
    });

    const req = httpMock.expectOne('/api/warehouses');
    expect(req.request.method).toBe('GET');
    req.flush(mockWarehouses);
  });

  it('should adjust inventory with query params via PATCH /api/inventory/adjust', () => {
    const mockInventory: Inventory = {
      id: 5,
      product: { id: 1, name: 'Item', sku: 'SKU-1', price: 10, reorderLevel: 5 },
      warehouse: mockWarehouse,
      quantity: 45
    };

    service.adjustInventory(1, 1, 10).subscribe(res => {
      expect(res).toEqual(mockInventory);
    });

    const req = httpMock.expectOne(r => r.url === '/api/inventory/adjust');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.params.get('productId')).toBe('1');
    expect(req.request.params.get('warehouseId')).toBe('1');
    expect(req.request.body).toEqual({ delta: 10 });
    req.flush(mockInventory);
  });

  it('should place customer order via POST /api/orders', () => {
    const orderPayload = {
      customerName: 'Enterprise Client',
      warehouseId: 1,
      items: [{ productId: 1, quantity: 5, unitPrice: 20 }]
    };
    const mockOrder: CustomerOrder = {
      id: 1,
      customerName: 'Enterprise Client',
      status: 'PLACED',
      orderDate: '2026-10-28T00:00:00Z',
      totalAmount: 100,
      warehouse: mockWarehouse,
      items: []
    };

    service.placeCustomerOrder(orderPayload).subscribe(res => {
      expect(res).toEqual(mockOrder);
    });

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(orderPayload);
    req.flush(mockOrder);
  });

  it('should transition purchase order status to RECEIVED via PATCH /api/purchase-orders/:id/mark-received', () => {
    const mockPO: PurchaseOrder = {
      id: 8,
      supplier: mockSupplier,
      warehouse: mockWarehouse,
      status: 'RECEIVED',
      totalCost: 1500,
      orderDate: '2026-10-28T00:00:00Z',
      items: []
    };

    service.markPOReceived(8).subscribe(res => {
      expect(res.status).toBe('RECEIVED');
    });

    const req = httpMock.expectOne('/api/purchase-orders/8/mark-received');
    expect(req.request.method).toBe('PATCH');
    req.flush(mockPO);
  });
});
