import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const token = authService.token();

  let authReq = req;
  const isPublicAuth = req.url.includes('/api/auth/login') || req.url.includes('/api/users/register');

  if (token && !isPublicAuth && req.url.startsWith('/api')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicAuth) {
        toastService.error('Session expired or unauthorized. Please sign in again.', 'Authentication Required');
        authService.logout();
      } else if (error.status === 403) {
        toastService.error('You do not have permission for this action.', 'Access Denied');
      }
      return throwError(() => error);
    })
  );
};
