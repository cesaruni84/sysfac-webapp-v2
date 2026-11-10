import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CURRENT_USER_KEY, SessionService } from '../../core/auth';
import { usuarioMock } from '../../core/auth/auth.testing';
import type { Usuario } from '../../core/models';
import { CLASE_MODO_OSCURO } from '../tema/modo-oscuro.service';
import { LayoutHeader, iniciales, textoEmpresa } from './header';

const usuarioCompleto = {
  ...usuarioMock,
  nombres: 'Juan',
  apellidos: 'Pérez',
  cargo: 'Administrador',
  empresa: { ...usuarioMock.empresa, comercial: 'TRANSPORTES SAC', ruc: '20123456789' },
} as Usuario;

describe('textoEmpresa / iniciales', () => {
  it('empresa como v1: "<comercial> - RUC <ruc>"', () => {
    expect(textoEmpresa(usuarioCompleto)).toBe('TRANSPORTES SAC - RUC 20123456789');
  });

  it('sin comercial usa la razón social; sin RUC solo el nombre; sin usuario vacío', () => {
    expect(textoEmpresa(usuarioMock)).toBe('R');
    expect(textoEmpresa({ ...usuarioMock, empresa: { ...usuarioMock.empresa, ruc: '1' } })).toBe(
      'R - RUC 1',
    );
    expect(textoEmpresa(null)).toBe('');
  });

  it('iniciales de nombres y apellidos', () => {
    expect(iniciales(usuarioCompleto)).toBe('JP');
    expect(iniciales({ ...usuarioMock, nombres: '', apellidos: '' })).toBe('A');
    expect(iniciales(null)).toBe('');
  });
});

describe('LayoutHeader', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(CLASE_MODO_OSCURO);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(SessionService).setUserLoggedIn(usuarioCompleto);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(CLASE_MODO_OSCURO);
  });

  function crear() {
    const fixture = TestBed.createComponent(LayoutHeader);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra empresa y usuario de la sesión', () => {
    const el = crear().nativeElement as HTMLElement;
    expect(el.querySelector('header')).not.toBeNull();
    expect(el.querySelector('[data-testid="header-empresa"]')?.textContent?.trim()).toBe(
      'TRANSPORTES SAC - RUC 20123456789',
    );
    const usuario = el.querySelector('[data-testid="header-usuario"]')?.textContent ?? '';
    expect(usuario).toContain('Juan Pérez');
    expect(usuario).toContain('Administrador');
    expect(el.textContent).toContain('JP');
  });

  it('los botones de icono tienen aria-label', () => {
    const el = crear().nativeElement as HTMLElement;
    const etiquetas = Array.from(el.querySelectorAll('button')).map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(etiquetas).toEqual(
      expect.arrayContaining([
        'Abrir menú',
        'Ocultar menú lateral',
        'Usar modo oscuro',
        'Menú de usuario',
      ]),
    );
    expect(etiquetas.every((e) => !!e)).toBe(true);
  });

  it('emite los eventos de los botones de menú', () => {
    const fixture = crear();
    const movil = vi.fn();
    const escritorio = vi.fn();
    fixture.componentInstance.abrirMenuMovil.subscribe(movil);
    fixture.componentInstance.alternarSidebar.subscribe(escritorio);
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('button[aria-label="Abrir menú"]')?.click();
    el.querySelector<HTMLButtonElement>('button[aria-label="Ocultar menú lateral"]')?.click();
    expect(movil).toHaveBeenCalledTimes(1);
    expect(escritorio).toHaveBeenCalledTimes(1);
  });

  it('el botón de modo oscuro alterna la clase app-dark', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('button[aria-label="Usar modo oscuro"]')?.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains(CLASE_MODO_OSCURO)).toBe(true);
    el.querySelector<HTMLButtonElement>('button[aria-label="Usar modo claro"]')?.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains(CLASE_MODO_OSCURO)).toBe(false);
  });

  it('"Cerrar sesión" limpia la sesión y navega a /sessions/signin (como v1)', () => {
    const fixture = crear();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const cerrar = fixture.componentInstance.opcionesUsuario()[0].items?.[0];
    expect(cerrar?.label).toBe('Cerrar sesión');
    cerrar?.command?.({});
    expect(localStorage.getItem(CURRENT_USER_KEY)).toBeNull();
    expect(TestBed.inject(SessionService).usuarioActual()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/sessions/signin']);
  });
});
