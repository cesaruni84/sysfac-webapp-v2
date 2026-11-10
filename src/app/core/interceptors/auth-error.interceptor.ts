import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';

/**
 * Manejo global de errores HTTP. v1 no envía token ni Authorization: no se añade ninguna cabecera.
 * - 401 (fuera del login): limpia sesión y navega a /sessions/signin con returnUrl.
 * - Resto: se propaga sin modificar (las pantallas leen `error.error.codeMessage`).
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const loginUrl = inject(AuthService).loginUrl;

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && req.url !== loginUrl) {
          session.deleteUserLoggedIn();
          router.navigate(['/sessions/signin'], { queryParams: { returnUrl: router.url } });
        }
        // TODO(3.2): mostrar aquí un toast global con el mensaje del error.
      }
      return throwError(() => error);
    }),
  );
};
