import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LandingComponent } from './landing.component';
import { AuthService } from '../../services/auth.service';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  const mockAuthService = {
    isAuthenticated: signal(false),
    currentUser: signal(null),
    isWarehouseManager: () => false,
    isAdmin: () => false,
    isSales: () => false,
    logout: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the landing component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle and close mobile navigation drawer', () => {
    expect(component.mobileNavOpen()).toBe(false);

    component.toggleMobileNav();
    expect(component.mobileNavOpen()).toBe(true);

    component.closeMobileNav();
    expect(component.mobileNavOpen()).toBe(false);
  });

  it('should update 3D art tilt on mouse move and reset on leave', () => {
    const fakeEvent = {
      clientX: 350,
      clientY: 100,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 100, top: 100, width: 400, height: 200 })
      }
    } as unknown as MouseEvent;

    component.onArtMouseMove(fakeEvent);
    expect(component.tiltX()).not.toBe(0);
    expect(component.tiltY()).not.toBe(0);

    component.resetArtTilt();
    expect(component.tiltX()).toBe(0);
    expect(component.tiltY()).toBe(0);
  });

  it('should show Sign In and Create Account when user is unauthenticated', () => {
    mockAuthService.isAuthenticated.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const signInLink = compiled.querySelector('.nav-action-link');
    expect(signInLink).toBeTruthy();
    expect(signInLink?.textContent).toContain('Sign In');
    expect(compiled.querySelector('.nav-links')).toBeNull();

    const signUpLink = compiled.querySelector('.nav-actions .btn-primary-pill');
    expect(signUpLink?.getAttribute('href')).toBe('/register');
    expect(signUpLink?.textContent).toContain('Sign Up');

    const createAccountBtn = compiled.querySelector('.btn-outline-explore');
    expect(createAccountBtn).toBeTruthy();
    expect(createAccountBtn?.textContent).toContain('CREATE ACCOUNT');
  });

  it('should hide Sign In and Create Account when user is authenticated', () => {
    mockAuthService.isAuthenticated.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const signInLink = compiled.querySelector('.nav-action-link');
    expect(signInLink).toBeNull();
    expect(compiled.querySelector('.nav-links')).toBeTruthy();
    expect(compiled.querySelector('.nav-actions .btn-primary-pill')?.textContent).toContain('Open Console');

    const createAccountBtn = compiled.querySelector('.btn-outline-explore');
    expect(createAccountBtn).toBeNull();

    const actionText = compiled.querySelector('.dual-pill-action');
    expect(actionText?.textContent).toContain('GO TO DASHBOARD');
  });
});
