import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { AccountStatus, AuthResponse, User, UserRole } from '../models/inventory.models';

const TOKEN_KEY = 'rims_auth_token';
const USER_KEY = 'rims_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSignal = signal<string | null>(this.getStoredToken());
  private currentUserSignal = signal<{ username: string; role: UserRole; approved: boolean } | null>(this.getStoredUser());

  public readonly token = this.tokenSignal.asReadonly();
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.tokenSignal());
  public readonly role = computed(() => this.currentUserSignal()?.role ?? null);
  public readonly isApproved = computed(() => this.currentUserSignal()?.approved ?? false);
  public readonly isSuperAdmin = computed(() => this.role() === 'SUPER_ADMIN');
  public readonly isAdmin = computed(() => this.role() === 'ADMIN' || this.isSuperAdmin());
  public readonly isWarehouseManager = computed(() => this.role() === 'WAREHOUSE_MANAGER' || this.isAdmin());
  public readonly isSales = computed(() => this.role() === 'SALES' || this.isAdmin());

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): { username: string; role: UserRole; approved: boolean } | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (!data) return null;
      const user = JSON.parse(data);
      return { ...user, approved: user.approved ?? user.role !== 'PENDING' };
    } catch {
      return null;
    }
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      map(response => {
        const token = response?.token?.trim();
        if (!token) {
          throw new Error('The sign-in response did not include an authentication token.');
        }

        const username = response.username?.trim() || credentials.username.trim();
        const approved = response.approved ?? response.role !== 'PENDING';
        const userData = { username, role: response.role, approved };

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        this.tokenSignal.set(token);
        this.currentUserSignal.set(userData);

        return { ...response, token, username, approved };
      })
    );
  }

  refreshAccountStatus(): Observable<AccountStatus> {
    return this.http.get<AccountStatus>('/api/auth/status').pipe(tap(status => {
      this.currentUserSignal.set(status);
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(status));
      } catch {
        // Keep the refreshed approval state in memory if storage is unavailable.
      }
    }));
  }

  register(user: Partial<User>): Observable<User> {
    return this.http.post<User>('/api/users/register', user);
  }

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing auth storage', e);
    }
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
