import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { signal } from '@angular/core';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenSignal = signal<string | null>(null);
  let mockAuthService: { token: typeof tokenSignal; logout: ReturnType<typeof vi.fn> };
  let mockToastService: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tokenSignal.set(null);
    mockAuthService = {
      token: tokenSignal,
      logout: vi.fn()
    };
    mockToastService = {
      error: vi.fn(),
      success: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Bearer token to protected /api requests when token is present', () => {
    tokenSignal.set('my-secret-jwt-token');

    http.get('/api/products').subscribe();

    const req = httpMock.expectOne('/api/products');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-secret-jwt-token');
    req.flush([]);
  });

  it('should NOT attach Authorization header when token is null', () => {
    tokenSignal.set(null);

    http.get('/api/products').subscribe();

    const req = httpMock.expectOne('/api/products');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('should NOT attach Authorization header for public auth routes like /api/auth/login', () => {
    tokenSignal.set('existing-token');

    http.post('/api/auth/login', { username: 'test', password: 'pwd' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should trigger toast and logout on 401 Unauthorized for protected endpoints', () => {
    tokenSignal.set('expired-token');

    let errorResponse: HttpErrorResponse | undefined;
    http.get('/api/inventory').subscribe({
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpMock.expectOne('/api/inventory');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorResponse?.status).toBe(401);
    expect(mockToastService.error).toHaveBeenCalledWith(
      'Session expired or unauthorized. Please sign in again.',
      'Authentication Required'
    );
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should trigger toast on 403 Forbidden', () => {
    tokenSignal.set('valid-token');

    let errorResponse: HttpErrorResponse | undefined;
    http.delete('/api/users/2').subscribe({
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpMock.expectOne('/api/users/2');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(errorResponse?.status).toBe(403);
    expect(mockToastService.error).toHaveBeenCalledWith(
      'You do not have permission for this action.',
      'Access Denied'
    );
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });
});
