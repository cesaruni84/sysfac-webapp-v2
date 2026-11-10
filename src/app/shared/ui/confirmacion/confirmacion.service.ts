import { Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

/** Opciones de `ConfirmacionService.confirmar`. Todas son opcionales. */
export interface OpcionesConfirmacion {
  /** Título del diálogo. Por defecto `'Confirmación'` (como `app-confirm` de v1). */
  titulo?: string;
  /** Texto de la pregunta (se muestra como texto plano, no como HTML). */
  mensaje?: string;
  /** Texto del botón de aceptar. Por defecto `'Aceptar'`. */
  aceptar?: string;
  /** Texto del botón de cancelar. Por defecto `'Cancelar'`. */
  cancelar?: string;
  /** Acción destructiva (eliminar, anular): botón rojo, ícono de alerta y foco en "Cancelar". */
  peligro?: boolean;
}

/** Textos por defecto (v1: título `Confirmación`, botones `OK`/`Cancelar`). */
export const TEXTOS_CONFIRMACION = {
  titulo: 'Confirmación',
  mensaje: '¿Está seguro?',
  aceptar: 'Aceptar',
  cancelar: 'Cancelar',
} as const;

export const ICONO_CONFIRMACION = 'pi pi-info-circle';
export const ICONO_CONFIRMACION_PELIGRO = 'pi pi-exclamation-triangle';

/**
 * Diálogo de confirmación (reemplaza `AppConfirmService` de v1, que devolvía un `Observable<boolean>`).
 *
 * Devuelve una promesa que resuelve `true` al aceptar y `false` al cancelar, cerrar con la X o
 * pulsar Escape. Si se pide otra confirmación con una abierta, la anterior resuelve `false`.
 * Requiere `<app-confirmacion-host />` montado una vez (en el shell).
 *
 * ```ts
 * private readonly confirmacion = inject(ConfirmacionService);
 *
 * async eliminar(chofer: Chofer) {
 *   const ok = await this.confirmacion.confirmar({
 *     mensaje: `¿Confirma eliminar el registro: ${chofer.nombres}?`,
 *     aceptar: 'Eliminar',
 *     peligro: true,
 *   });
 *   if (!ok) return;
 *   ...
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  /**
   * Canal privado con el `p-confirmdialog` del host (`ConfirmacionHost` lo provee como
   * `ConfirmationService`). No usar desde las pantallas.
   * @internal
   */
  readonly canal = new ConfirmationService();

  private pendiente: ((respuesta: boolean) => void) | null = null;

  confirmar(opciones: OpcionesConfirmacion = {}): Promise<boolean> {
    // Una confirmación nueva reemplaza a la abierta: la anterior se da por cancelada.
    this.pendiente?.(false);

    return new Promise<boolean>((resolve) => {
      let resuelta = false;
      const responder = (respuesta: boolean) => {
        if (resuelta) return;
        resuelta = true;
        if (this.pendiente === responder) this.pendiente = null;
        resolve(respuesta);
      };
      this.pendiente = responder;

      const peligro = opciones.peligro ?? false;
      const aceptar = opciones.aceptar ?? TEXTOS_CONFIRMACION.aceptar;
      const cancelar = opciones.cancelar ?? TEXTOS_CONFIRMACION.cancelar;
      this.canal.confirm({
        header: opciones.titulo ?? TEXTOS_CONFIRMACION.titulo,
        message: opciones.mensaje ?? TEXTOS_CONFIRMACION.mensaje,
        icon: peligro ? ICONO_CONFIRMACION_PELIGRO : ICONO_CONFIRMACION,
        acceptLabel: aceptar,
        rejectLabel: cancelar,
        acceptButtonProps: { label: aceptar, severity: peligro ? 'danger' : 'primary' },
        rejectButtonProps: { label: cancelar, severity: 'secondary', outlined: true },
        defaultFocus: peligro ? 'reject' : 'accept',
        closable: true,
        closeOnEscape: true,
        accept: () => responder(true),
        reject: () => responder(false),
      });
    });
  }
}
