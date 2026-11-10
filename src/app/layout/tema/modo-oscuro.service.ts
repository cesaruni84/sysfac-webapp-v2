import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

/** Clase de modo oscuro en `<html>` (es el `darkModeSelector` de PrimeNG en `app.config.ts`). */
export const CLASE_MODO_OSCURO = 'app-dark';

/** Clave de `localStorage` con la preferencia (`'1'` oscuro, `'0'` claro). */
export const CLAVE_MODO_OSCURO = 'sysfac-modo-oscuro';

/**
 * Modo oscuro opcional (no existía en v1). Agrega o quita `app-dark` en `<html>` y recuerda
 * la preferencia en `localStorage` (con try/catch: modo privado o almacenamiento bloqueado).
 *
 * Al crearse aplica la preferencia guardada; por defecto, modo claro (como v1).
 */
@Injectable({ providedIn: 'root' })
export class ModoOscuroService {
  private readonly html = inject(DOCUMENT).documentElement;
  private readonly _activo = signal(leerPreferencia());

  /** `true` si el modo oscuro está activo. */
  readonly activo = this._activo.asReadonly();

  constructor() {
    this.aplicar(this._activo());
  }

  alternar(): void {
    this.establecer(!this._activo());
  }

  establecer(oscuro: boolean): void {
    this._activo.set(oscuro);
    this.aplicar(oscuro);
    try {
      localStorage.setItem(CLAVE_MODO_OSCURO, oscuro ? '1' : '0');
    } catch {
      // Sin almacenamiento: la preferencia dura solo esta sesión.
    }
  }

  private aplicar(oscuro: boolean): void {
    this.html.classList.toggle(CLASE_MODO_OSCURO, oscuro);
  }
}

function leerPreferencia(): boolean {
  try {
    return localStorage.getItem(CLAVE_MODO_OSCURO) === '1';
  } catch {
    return false;
  }
}
