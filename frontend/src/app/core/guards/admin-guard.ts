import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const isRoleAdmin = JSON.stringify(payload).includes('ROLE_ADMIN');

      if (isRoleAdmin) {
        return true;
      }
    } catch {
      localStorage.removeItem('token');
    }
  }

  router.navigate(['/feed']);
  return false;
};
