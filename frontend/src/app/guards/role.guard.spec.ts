import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { signal } from '@angular/core';
import { UserRole } from '../models/inventory.models';

describe('roleGuard', () => {
  let isAuthSignal = signal<boolean>(false);
  let roleSignal = signal<UserRole | null>(null);
  let isAdminSignal = signal<boolean>(false);

  let mockAuthService: {
    isAuthenticated: typeof isAuthSignal;
    role: typeof roleSignal;
    isAdmin: typeof isAdminSignal;
  };

  let mockToastService: {
    error: ReturnType<typeof vi.fn>;
  };

  let router: Router;

  beforeEach(() => {
    isAuthSignal.set(false);
    roleSignal.set(null);
    isAdminSignal.set(false);

    mockAuthService = {
      isAuthenticated: isAuthSignal,
      role: roleSignal,
      isAdmin: isAdminSignal
    };

    mockToastService = {
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService }
      ]
    });

    router = TestBed.inject(Router);
  });

  const createRouteSnapshot = (roles?: UserRole[]): ActivatedRouteSnapshot => {
    return {
      data: roles ? { roles } : {}
    } as unknown as ActivatedRouteSnapshot;
  };

  it('should redirect unauthenticated users to /login', () => {
    isAuthSignal.set(false);
    const route = createRouteSnapshot(['ADMIN']);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('should allow access to ADMIN regardless of route role restriction', () => {
    isAuthSignal.set(true);
    roleSignal.set('ADMIN');
    isAdminSignal.set(true);
    const route = createRouteSnapshot(['WAREHOUSE_MANAGER']);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(true);
  });

  it('should allow access to WAREHOUSE_MANAGER when role is included in route data', () => {
    isAuthSignal.set(true);
    roleSignal.set('WAREHOUSE_MANAGER');
    isAdminSignal.set(false);
    const route = createRouteSnapshot(['ADMIN', 'WAREHOUSE_MANAGER']);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(true);
  });

  it('should deny access, trigger toast error, and redirect to /dashboard when user role is not allowed', () => {
    isAuthSignal.set(true);
    roleSignal.set('SALES');
    isAdminSignal.set(false);
    const route = createRouteSnapshot(['ADMIN', 'WAREHOUSE_MANAGER']);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
    expect(mockToastService.error).toHaveBeenCalledWith(
      'You do not have permission to access this view.',
      'Access Restricted'
    );
  });
});
