import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/** Severidad del aviso. Coincide con `severity` de PrimeNG, pero `core` no depende de PrimeNG. */
export type SeveridadNotificacion = 'success' | 'info' | 'warn' | 'error';

/** Aviso para el usuario. El layout (3.2) lo muestra con un `p-toast` global. */
export interface Notificacion {
  severidad: SeveridadNotificacion;
  titulo: string;
  detalle?: string;
}

/**
 * Bus de avisos de la aplicación (toasts), sin dependencias de PrimeNG.
 *
 * - Lo usan el interceptor HTTP (errores de red y 5xx) y las pantallas para sus avisos.
 * - El shell del layout se suscribe a `notificaciones$` y los muestra con `MessageService`.
 * - Es un `Subject` (no un signal) para no perder avisos emitidos en el mismo ciclo.
 *   Los avisos emitidos sin nadie suscrito (p. ej. en /sessions, fuera del shell) se descartan.
 *
 * Uso desde una pantalla:
 * ```ts
 * private readonly avisos = inject(NotificacionService);
 * this.avisos.exito('Guía registrada', 'Se registró la guía 001-123.');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly bus = new Subject<Notificacion>();

  /** Flujo de avisos publicados. */
  readonly notificaciones$: Observable<Notificacion> = this.bus.asObservable();

  publicar(notificacion: Notificacion): void {
    this.bus.next(notificacion);
  }

  exito(titulo: string, detalle?: string): void {
    this.publicar({ severidad: 'success', titulo, detalle });
  }

  info(titulo: string, detalle?: string): void {
    this.publicar({ severidad: 'info', titulo, detalle });
  }

  advertencia(titulo: string, detalle?: string): void {
    this.publicar({ severidad: 'warn', titulo, detalle });
  }

  error(titulo: string, detalle?: string): void {
    this.publicar({ severidad: 'error', titulo, detalle });
  }
}
