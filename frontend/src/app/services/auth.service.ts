import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User, UserRole } from '../models/inventory.models';

const TOKEN_KEY = 'rims_auth_token';
const USER_KEY = 'rims_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSignal = signal<string | null>(this.getStoredToken());
  private currentUserSignal = signal<{ username: string; role: UserRole } | null>(this.getStoredUser());

  public readonly token = this.tokenSignal.asReadonly();
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.tokenSignal());
  public readonly role = computed(() => this.currentUserSignal()?.role ?? null);
  public readonly isAdmin = computed(() => this.role() === 'ADMIN');
  public readonly isWarehouseManager = computed(() => this.role() === 'WAREHOUSE_MANAGER' || this.role() === 'ADMIN');
  public readonly isSales = computed(() => this.role() === 'SALES' || this.role() === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): { username: string; role: UserRole } | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(TOKEN_KEY, response.token);
          const userData = { username: response.username, role: response.role };
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          this.tokenSignal.set(response.token);
          this.currentUserSignal.set(userData);
        }
      })
    );
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
