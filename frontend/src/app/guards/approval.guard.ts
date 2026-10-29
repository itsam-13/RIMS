import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const approvalGuard: CanActivateChildFn = (route) => {
  const authService = inject(AuthService);
  if (authService.isApproved() || route.routeConfig?.path === 'dashboard') return true;
  return inject(Router).createUrlTree(['/dashboard']);
};
