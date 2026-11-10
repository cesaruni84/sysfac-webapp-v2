import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { LOGIN_URL } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';
import { NotificacionService } from '../notifications/notificacion.service';

/** Aviso global para errores de red (status 0: servidor caído, CORS, sin internet). */
export const AVISO_SIN_CONEXION = {
  titulo: 'Sin conexión con el servidor',
  detalle: 'Verifique su conexión a internet e intente nuevamente.',
} as const;

/** Aviso global para errores 5xx. Detalle genérico: la pantalla muestra su `codeMessage`. */
export const AVISO_ERROR_SERVIDOR = {
  titulo: 'Error del servidor',
  detalle: 'Ocurrió un error inesperado. Intente nuevamente en unos minutos.',
} as const;

/**
 * Manejo global de errores HTTP. v1 no envía token ni Authorization: no se añade ninguna cabecera.
 * - 401 (fuera del login): limpia sesión y navega a /sessions/signin sin query params (como v1),
 *   salvo que ya se esté en /sessions/*.
 * - status 0 y 5xx: publica un aviso global (toast del layout) con `NotificacionService`.
 * - 4xx: sin aviso global; las pantallas muestran su mensaje de negocio (`error.error.codeMessage`).
 * - El error siempre se propaga sin modificar.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const avisos = inject(NotificacionService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && req.url !== LOGIN_URL) {
          session.deleteUserLoggedIn();
          if (!router.url.startsWith('/sessions')) {
            router.navigate(['/sessions/signin']);
          }
        } else if (error.status === 0) {
          avisos.error(AVISO_SIN_CONEXION.titulo, AVISO_SIN_CONEXION.detalle);
        } else if (error.status >= 500) {
          avisos.error(AVISO_ERROR_SERVIDOR.titulo, AVISO_ERROR_SERVIDOR.detalle);
        }
      }
      return throwError(() => error);
    }),
  );
};
