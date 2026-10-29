import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { approvalGuard } from './approval.guard';
import { AuthService } from '../services/auth.service';

describe('approvalGuard', () => {
  const approved = signal(false);

  beforeEach(() => {
    approved.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isApproved: approved } }
      ]
    });
  });

  it('lets unapproved accounts see the dashboard only', () => {
    const dashboard = { routeConfig: { path: 'dashboard' } } as ActivatedRouteSnapshot;
    const inventory = { routeConfig: { path: 'inventory' } } as ActivatedRouteSnapshot;

    expect(TestBed.runInInjectionContext(() => approvalGuard(dashboard, {} as any))).toBe(true);
    const result = TestBed.runInInjectionContext(() => approvalGuard(inventory, {} as any));
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });

  it('allows an approved account to access workspace routes', () => {
    approved.set(true);
    const inventory = { routeConfig: { path: 'inventory' } } as ActivatedRouteSnapshot;
    expect(TestBed.runInInjectionContext(() => approvalGuard(inventory, {} as any))).toBe(true);
  });
});
