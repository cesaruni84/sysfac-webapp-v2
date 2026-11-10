import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import type { Usuario } from '../models';

/** Clave de localStorage; idéntica a v1. */
export const CURRENT_USER_KEY = 'currentUser';

/** Validación mínima de forma: objeto con id numérico, codigo string y empresa objeto. */
function esUsuario(valor: unknown): valor is Usuario {
  if (typeof valor !== 'object' || valor === null) return false;
  const u = valor as Record<string, unknown>;
  return (
    typeof u['id'] === 'number' &&
    typeof u['codigo'] === 'string' &&
    typeof u['empresa'] === 'object' &&
    u['empresa'] !== null
  );
}

/** Equivalente a `UsuarioService` de v1: sesión del usuario guardada en localStorage. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _usuario = signal<Usuario | null>(this.leer());

  /** Usuario actual (solo lectura). `null` si no hay sesión. */
  readonly usuarioActual = this._usuario.asReadonly();

  constructor() {
    // Sincroniza con otras pestañas (solo navegador).
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent): void => {
      // key === null: localStorage.clear() en otra pestaña.
      if (e.key === null || e.key === CURRENT_USER_KEY) this._usuario.set(this.leer());
    };
    window.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', onStorage));
  }

  setUserLoggedIn(user: Usuario): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this._usuario.set(user);
  }

  deleteUserLoggedIn(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
    this._usuario.set(null);
  }

  /** Lee de localStorage (fuente de verdad). Devuelve `null` si falta o está corrupto. */
  getUserLoggedIn(): Usuario | null {
    return this.leer();
  }

  isAuthenticated(): boolean {
    return this.getUserLoggedIn() !== null;
  }

  private leer(): Usuario | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      return esUsuario(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
