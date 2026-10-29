import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { InventoryApiService } from '../../services/inventory-api.service';
import { AuthService } from '../../services/auth.service';
import { Inventory, Product, PurchaseOrder, StockMovement, Warehouse } from '../../models/inventory.models';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const mockWarehouse: Warehouse = {
    id: 1,
    name: 'Austin Warehouse',
    location: 'Austin, TX',
    capacity: 20000
  };

  const mockProducts: Product[] = [
    { id: 1, name: 'Item A', sku: 'SKU-A', price: 10, reorderLevel: 20 },
    { id: 2, name: 'Item B', sku: 'SKU-B', price: 25, reorderLevel: 5 },
    { id: 3, name: 'Item C', sku: 'SKU-C', price: 50, reorderLevel: 15 }
  ];

  const mockInventory: Inventory[] = [
    { id: 1, product: mockProducts[0], warehouse: mockWarehouse, quantity: 8 },
    { id: 2, product: mockProducts[0], warehouse: mockWarehouse, quantity: 5 }, // Item A total = 13 (<= 20, low stock)
    { id: 3, product: mockProducts[1], warehouse: mockWarehouse, quantity: 30 }, // Item B total = 30 (> 5, healthy)
    { id: 4, product: mockProducts[2], warehouse: mockWarehouse, quantity: 10 }  // Item C total = 10 (<= 15, low stock)
  ];

  const mockPOs: PurchaseOrder[] = [
    { id: 1, status: 'PENDING', orderDate: '2026-10-25T10:00:00Z', items: [] },
    { id: 2, status: 'ORDERED', orderDate: '2026-10-26T10:00:00Z', items: [] },
    { id: 3, status: 'RECEIVED', orderDate: '2026-10-24T10:00:00Z', items: [] },
    { id: 4, status: 'CANCELLED', orderDate: '2026-10-23T10:00:00Z', items: [] }
  ];

  const mockMovements: StockMovement[] = [
    { id: 1, product: mockProducts[0], quantity: 10, type: 'IN', timestamp: '2026-10-26T12:00:00Z' }
  ];

  let mockApi: {
    getProducts: ReturnType<typeof vi.fn>;
    getInventory: ReturnType<typeof vi.fn>;
    getPurchaseOrders: ReturnType<typeof vi.fn>;
    getStockMovements: ReturnType<typeof vi.fn>;
  };

  let mockAuthService: {
    currentUser: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
    isWarehouseManager: ReturnType<typeof vi.fn>;
    isSales: ReturnType<typeof vi.fn>;
    isApproved: ReturnType<typeof vi.fn>;
    refreshAccountStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockApi = {
      getProducts: vi.fn().mockReturnValue(of(mockProducts)),
      getInventory: vi.fn().mockReturnValue(of(mockInventory)),
      getPurchaseOrders: vi.fn().mockReturnValue(of(mockPOs)),
      getStockMovements: vi.fn().mockReturnValue(of(mockMovements))
    };

    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ username: 'alex', role: 'ADMIN' }),
      isAdmin: vi.fn().mockReturnValue(true),
      isWarehouseManager: vi.fn().mockReturnValue(true),
      isSales: vi.fn().mockReturnValue(true),
      isApproved: vi.fn().mockReturnValue(true),
      refreshAccountStatus: vi.fn().mockReturnValue(of({ username: 'alex', role: 'SALES', approved: true }))
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: InventoryApiService, useValue: mockApi },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate totalUnits correctly from inventory signal', () => {
    component.inventory.set(mockInventory);
    // 8 + 5 + 30 + 10 = 53
    expect(component.totalUnits()).toBe(53);
  });

  it('should aggregate stock by product and filter lowStockProducts where total <= reorderLevel', () => {
    component.products.set(mockProducts);
    component.inventory.set(mockInventory);

    const lowStock = component.lowStockProducts();
    // Item A total is 13 <= reorderLevel 20 -> included
    // Item C total is 10 <= reorderLevel 15 -> included
    // Item B total is 30 > reorderLevel 5 -> excluded
    expect(lowStock.length).toBe(2);
    // Should be sorted ascending by total stock (Item C: 10, Item A: 13)
    expect(lowStock[0].id).toBe(3);
    expect(lowStock[0].totalStock).toBe(10);
    expect(lowStock[1].id).toBe(1);
    expect(lowStock[1].totalStock).toBe(13);
  });

  it('should filter openPurchaseOrders to only include PENDING and ORDERED statuses', () => {
    component.purchaseOrders.set(mockPOs);
    const openOrders = component.openPurchaseOrders();

    expect(openOrders.length).toBe(2);
    expect(openOrders.map(o => o.status)).toEqual(['ORDERED', 'PENDING']);
  });

  it('should load all data on ngOnInit and populate signals', () => {
    component.ngOnInit();

    expect(mockApi.getProducts).toHaveBeenCalled();
    expect(mockApi.getInventory).toHaveBeenCalled();
    expect(mockApi.getPurchaseOrders).toHaveBeenCalled();
    expect(mockApi.getStockMovements).toHaveBeenCalled();

    expect(component.products()).toEqual(mockProducts);
    expect(component.inventory()).toEqual(mockInventory);
    expect(component.purchaseOrders()).toEqual(mockPOs);
    expect(component.stockMovements()).toEqual(mockMovements);
    expect(component.loading()).toBe(false);
  });

  it('shows an approval notice and loads no workspace data for an unapproved account', () => {
    mockAuthService.isApproved.mockReturnValue(false);
    fixture.detectChanges();
    component.loadAllData();

    expect(fixture.nativeElement.textContent).toContain('Account awaiting approval');
    expect(mockApi.getProducts).not.toHaveBeenCalled();
    expect(mockApi.getInventory).not.toHaveBeenCalled();
  });

  it('loads the workspace after approval is refreshed', () => {
    mockAuthService.isApproved.mockReturnValue(false);
    mockAuthService.refreshAccountStatus.mockImplementation(() => {
      mockAuthService.isApproved.mockReturnValue(true);
      return of({ username: 'alex', role: 'SALES', approved: true });
    });
    component.checkApproval();

    expect(mockApi.getProducts).toHaveBeenCalled();
    expect(mockAuthService.isApproved).toHaveReturnedWith(true);
  });

  it('should handle API failure gracefully and set error signal', () => {
    mockApi.getProducts.mockReturnValue(throwError(() => new Error('Server connection lost')));

    component.loadAllData();

    expect(component.error()).toBe('The overview could not be loaded. Check your connection and try again.');
    expect(component.loading()).toBe(false);
  });
});
