import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;

  let mockAuthService: {
    register: ReturnType<typeof vi.fn>;
  };

  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      register: vi.fn()
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'username' ? 'unregistered.user' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create and prefill username from query parameters if redirected from login', () => {
    expect(component).toBeTruthy();
    expect(component.registerData.username).toBe('unregistered.user');
    expect(component.redirectedFromLogin).toBe(true);
  });

  it('should display warning if fields are missing', () => {
    component.registerData.username = '';
    component.registerData.email = '';
    component.registerData.password = '';
    component.onRegister();

    expect(mockToastService.warning).toHaveBeenCalledWith('Please complete all fields to create your account.');
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should display warning if password length is under 6 characters', () => {
    component.registerData.username = 'newuser';
    component.registerData.email = 'newuser@mail.com';
    component.registerData.password = '123';
    component.onRegister();

    expect(mockToastService.warning).toHaveBeenCalledWith('Password must be at least 6 characters long.');
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should create account and redirect to /login with username on success', () => {
    component.registerData.username = 'newuser';
    component.registerData.email = 'newuser@mail.com';
    component.registerData.password = 'password123';

    mockAuthService.register.mockReturnValue(
      of({ id: 10, username: 'newuser', email: 'newuser@mail.com', role: 'SALES', approved: false })
    );

    component.onRegister();

    expect(mockAuthService.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'newuser@mail.com',
      password: 'password123'
    });
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Account for newuser is ready. Sign in to see your approval status.',
      'Account created'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { username: 'newuser' }
    });
    expect(component.loading()).toBe(false);
  });

  it('should display error toast on registration failure', () => {
    component.registerData.username = 'existinguser';
    component.registerData.email = 'existing@mail.com';
    component.registerData.password = 'password123';

    mockAuthService.register.mockReturnValue(
      throwError(() => ({
        error: { error: "Username 'existinguser' is already taken" }
      }))
    );

    component.onRegister();

    expect(mockToastService.error).toHaveBeenCalledWith(
      "Username 'existinguser' is already taken",
      'Registration failed'
    );
    expect(component.loading()).toBe(false);
  });

  it('should show field validation details returned by the API', () => {
    component.registerData.username = 'newuser';
    component.registerData.email = 'newuser@mail.com';
    component.registerData.password = 'password123';
    mockAuthService.register.mockReturnValue(
      throwError(() => ({ error: { error: 'Validation Failed', details: { email: 'must be valid' } } }))
    );

    component.onRegister();

    expect(mockToastService.error).toHaveBeenCalledWith('email: must be valid', 'Registration failed');
  });
});
