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
    } catch (e) {
      console.error('Failed to parse token in admin guard', e);
    }
  }

  router.navigate(['/feed']);
  return false;
};