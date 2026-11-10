import { Injectable, computed, signal } from '@angular/core';

/** Mensaje por defecto del indicador global (`AppLoaderService.open()` de v1). */
export const MENSAJE_CARGA_POR_DEFECTO = 'Procesando';

/**
 * Estado del indicador de carga global (reemplaza `AppLoaderService` de v1), sin dependencias de UI.
 *
 * - `abrir()`/`cerrar()` llevan un **contador**: con llamadas anidadas, el indicador sigue visible
 *   hasta que se cierra la última. `cerrar()` de más no deja el contador en negativo.
 * - El mensaje visible es el de la apertura más reciente que siga activa.
 * - El overlay visual es `<app-cargando-global />` (`shared/ui/loader`), montado una vez en el shell.
 *
 * Uso:
 * ```ts
 * private readonly carga = inject(CargaGlobalService);
 *
 * // Con promesas: abre y cierra aunque la tarea falle.
 * await this.carga.ejecutar(() => firstValueFrom(this.servicio.listar()), 'Cargando guías');
 *
 * // Con observables:
 * this.carga.abrir();
 * this.servicio.listar().pipe(finalize(() => this.carga.cerrar())).subscribe(...);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CargaGlobalService {
  /** Pila de mensajes de las aperturas activas (su longitud es el contador). */
  private readonly pila = signal<readonly string[]>([]);

  /** Cantidad de aperturas sin cerrar. */
  readonly contador = computed(() => this.pila().length);
  /** `true` mientras haya al menos una apertura activa. */
  readonly activo = computed(() => this.pila().length > 0);
  /** Mensaje de la apertura activa más reciente (`''` si no hay ninguna). */
  readonly mensaje = computed(() => this.pila().at(-1) ?? '');

  /** Muestra el indicador (o anida una apertura más). */
  abrir(mensaje: string = MENSAJE_CARGA_POR_DEFECTO): void {
    this.pila.update((p) => [...p, mensaje]);
  }

  /** Cierra la apertura más reciente. Sin aperturas activas no hace nada. */
  cerrar(): void {
    this.pila.update((p) => (p.length ? p.slice(0, -1) : p));
  }

  /** Cierra todas las aperturas (p. ej. al salir de una pantalla tras un error inesperado). */
  cerrarTodo(): void {
    this.pila.set([]);
  }

  /** Ejecuta `tarea` con el indicador abierto y lo cierra al terminar, con éxito o con error. */
  async ejecutar<T>(tarea: () => Promise<T>, mensaje?: string): Promise<T> {
    this.abrir(mensaje);
    try {
      return await tarea();
    } finally {
      this.cerrar();
    }
  }
}
