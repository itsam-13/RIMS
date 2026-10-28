import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/inventory.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created and start unauthenticated when storage is empty', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAdmin()).toBe(false);
    expect(service.isWarehouseManager()).toBe(false);
    expect(service.isSales()).toBe(false);
  });

  it('should store token and user in localStorage and update signals on login()', () => {
    const mockResponse: AuthResponse = {
      token: 'jwt-test-token-123',
      username: 'adminuser',
      role: 'ADMIN'
    };

    let resultResponse: AuthResponse | undefined;
    service.login({ username: 'adminuser', password: 'password123' }).subscribe(res => {
      resultResponse = res;
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'adminuser', password: 'password123' });
    req.flush(mockResponse);

    expect(resultResponse).toEqual(mockResponse);
    expect(service.token()).toBe('jwt-test-token-123');
    expect(service.currentUser()).toEqual({ username: 'adminuser', role: 'ADMIN' });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.isWarehouseManager()).toBe(true);
    expect(service.isSales()).toBe(true);

    expect(localStorage.getItem('rims_auth_token')).toBe('jwt-test-token-123');
    expect(JSON.parse(localStorage.getItem('rims_auth_user') || '{}')).toEqual({
      username: 'adminuser',
      role: 'ADMIN'
    });
  });

  it('should correctly compute role permissions for WAREHOUSE_MANAGER', () => {
    const mockResponse: AuthResponse = {
      token: 'jwt-manager-token',
      username: 'manager1',
      role: 'WAREHOUSE_MANAGER'
    };

    service.login({ username: 'manager1', password: 'password' }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush(mockResponse);

    expect(service.isAdmin()).toBe(false);
    expect(service.isWarehouseManager()).toBe(true);
    expect(service.isSales()).toBe(false);
  });

  it('should correctly compute role permissions for SALES', () => {
    const mockResponse: AuthResponse = {
      token: 'jwt-sales-token',
      username: 'salesperson',
      role: 'SALES'
    };

    service.login({ username: 'salesperson', password: 'password' }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush(mockResponse);

    expect(service.isAdmin()).toBe(false);
    expect(service.isWarehouseManager()).toBe(false);
    expect(service.isSales()).toBe(true);
  });

  it('should clear signals, remove items from localStorage, and navigate to /login on logout()', () => {
    localStorage.setItem('rims_auth_token', 'initial-token');
    localStorage.setItem('rims_auth_user', JSON.stringify({ username: 'test', role: 'ADMIN' }));

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('rims_auth_token')).toBeNull();
    expect(localStorage.getItem('rims_auth_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
