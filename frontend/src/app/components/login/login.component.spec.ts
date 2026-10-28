import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;

  let mockAuthService: {
    login: ReturnType<typeof vi.fn>;
  };

  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn()
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'username' ? 'prefilled.user' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create and prefill username from query parameters if present', () => {
    expect(component).toBeTruthy();
    expect(component.loginData.username).toBe('prefilled.user');
  });

  it('should display warning if username or password is missing on submit', () => {
    component.loginData.username = '';
    component.loginData.password = '';
    component.onLogin();

    expect(mockToastService.warning).toHaveBeenCalledWith('Enter your username and password to continue.');
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should sign in and navigate to /dashboard on valid credentials', () => {
    component.loginData.username = 'alex';
    component.loginData.password = 'password123';
    mockAuthService.login.mockReturnValue(of({ token: 'jwt-123', username: 'alex', role: 'ADMIN' }));

    component.onLogin();

    expect(mockAuthService.login).toHaveBeenCalledWith({ username: 'alex', password: 'password123' });
    expect(mockToastService.success).toHaveBeenCalledWith('Welcome back, alex.', 'Signed in');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading()).toBe(false);
  });

  it('should redirect to /register when account is not found (userNotFound = true)', () => {
    component.loginData.username = 'newuser';
    component.loginData.password = 'somepassword';
    mockAuthService.login.mockReturnValue(
      throwError(() => ({
        error: {
          error: "No account found with username 'newuser'. Please sign up first.",
          userNotFound: true
        }
      }))
    );

    component.onLogin();

    expect(mockToastService.warning).toHaveBeenCalledWith(
      'No account found for "newuser". Please sign up first.',
      'Account not registered'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/register'], {
      queryParams: { username: 'newuser' }
    });
    expect(component.loading()).toBe(false);
  });

  it('should display error toast on invalid password', () => {
    component.loginData.username = 'alex';
    component.loginData.password = 'wrongpwd';
    mockAuthService.login.mockReturnValue(
      throwError(() => ({
        error: {
          error: 'Invalid password. Please check your credentials and try again.',
          userNotFound: false
        }
      }))
    );

    component.onLogin();

    expect(mockToastService.error).toHaveBeenCalledWith(
      'Invalid password. Please check your credentials and try again.',
      'Sign in failed'
    );
    expect(router.navigate).not.toHaveBeenCalledWith(['/register'], expect.anything());
  });
});
