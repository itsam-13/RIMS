import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ShellComponent } from './shell.component';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/inventory.models';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;

  const mockUser = signal<{ username: string; role: UserRole } | null>({
    username: 'alex1',
    role: 'WAREHOUSE_MANAGER'
  });

  const mockAuthService = {
    currentUser: mockUser,
    isWarehouseManager: () => true,
    isAdmin: () => false,
    isSales: () => false,
    logout: vi.fn()
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the shell component and display user initials', () => {
    expect(component).toBeTruthy();
    expect(component.userInitials).toBe('AL');
    expect(component.userRoleLabel).toBe('Warehouse manager');
  });

  it('should toggle sidebar collapsed state and persist to localStorage when logo is clicked', () => {
    expect(component.sidebarCollapsed()).toBe(false);

    // Call toggleSidebar
    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('rims_sidebar_collapsed')).toBe('true');

    // Toggle back
    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(false);
    expect(localStorage.getItem('rims_sidebar_collapsed')).toBe('false');
  });

  it('should apply sidebar-collapsed class to app-layout when collapsed', () => {
    component.sidebarCollapsed.set(true);
    fixture.detectChanges();

    const layout = fixture.nativeElement.querySelector('.app-layout');
    expect(layout.classList.contains('sidebar-collapsed')).toBe(true);

    const logoBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.sidebar-brand-btn');
    expect(logoBtn.getAttribute('aria-expanded')).toBe('false');
    expect(logoBtn.getAttribute('title')).toBe('Expand sidebar');
  });

  it('should initialize sidebarCollapsed state from localStorage on ngOnInit', () => {
    localStorage.setItem('rims_sidebar_collapsed', 'true');

    const freshFixture = TestBed.createComponent(ShellComponent);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComponent.sidebarCollapsed()).toBe(true);
  });

  it('should toggle theme and persist to localStorage', () => {
    const initialTheme = component.theme();
    component.toggleTheme();
    const nextTheme = component.theme();

    expect(nextTheme).not.toBe(initialTheme);
    expect(localStorage.getItem('rims_theme')).toBe(nextTheme);
  });

  it('should close mobile nav on nav link click', () => {
    component.mobileNavOpen.set(true);
    component.onNavClick();
    expect(component.mobileNavOpen()).toBe(false);
  });
});
