import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/** Replica `AuthGuard` de v1: sin sesión redirige a /sessions/signin (v1 no usa returnUrl). */
export const authGuard: CanActivateFn = () => {
  if (inject(SessionService).isAuthenticated()) return true;
  inject(Router).navigate(['/sessions/signin']);
  return false;
};
