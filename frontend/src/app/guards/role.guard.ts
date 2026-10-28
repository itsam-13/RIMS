import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models/inventory.models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;
  const userRole = authService.role();

  // Admin has access to all operational routes
  if (!allowedRoles || authService.isAdmin() || (userRole && allowedRoles.includes(userRole))) {
    return true;
  }

  toast.error('You do not have permission to access this view.', 'Access Restricted');
  return router.createUrlTree(['/dashboard']);
};
