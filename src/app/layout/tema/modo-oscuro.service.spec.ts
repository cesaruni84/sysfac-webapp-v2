import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CLASE_MODO_OSCURO, CLAVE_MODO_OSCURO, ModoOscuroService } from './modo-oscuro.service';

describe('ModoOscuroService', () => {
  const html = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    html.classList.remove(CLASE_MODO_OSCURO);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    html.classList.remove(CLASE_MODO_OSCURO);
  });

  it('por defecto es modo claro', () => {
    const s = TestBed.inject(ModoOscuroService);
    expect(s.activo()).toBe(false);
    expect(html.classList.contains(CLASE_MODO_OSCURO)).toBe(false);
  });

  it('alternar agrega y quita la clase app-dark y guarda la preferencia', () => {
    const s = TestBed.inject(ModoOscuroService);
    s.alternar();
    expect(s.activo()).toBe(true);
    expect(html.classList.contains(CLASE_MODO_OSCURO)).toBe(true);
    expect(localStorage.getItem(CLAVE_MODO_OSCURO)).toBe('1');
    s.alternar();
    expect(s.activo()).toBe(false);
    expect(html.classList.contains(CLASE_MODO_OSCURO)).toBe(false);
    expect(localStorage.getItem(CLAVE_MODO_OSCURO)).toBe('0');
  });

  it('aplica la preferencia guardada al crearse', () => {
    localStorage.setItem(CLAVE_MODO_OSCURO, '1');
    const s = TestBed.inject(ModoOscuroService);
    expect(s.activo()).toBe(true);
    expect(html.classList.contains(CLASE_MODO_OSCURO)).toBe(true);
  });

  it('funciona aunque localStorage falle', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const s = TestBed.inject(ModoOscuroService);
    expect(s.activo()).toBe(false);
    s.establecer(true);
    expect(s.activo()).toBe(true);
    expect(html.classList.contains(CLASE_MODO_OSCURO)).toBe(true);
  });
});
