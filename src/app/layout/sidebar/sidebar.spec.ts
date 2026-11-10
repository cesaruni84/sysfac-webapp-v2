import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SessionService } from '../../core/auth';
import { usuarioMock } from '../../core/auth/auth.testing';
import type { Usuario } from '../../core/models';
import { MENU_NEGOCIO } from '../../core/navigation';
import { LayoutSidebar } from './sidebar';

@Component({ template: '' })
class Vacia {}

describe('LayoutSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Vacia }])],
    });
  });

  afterEach(() => localStorage.clear());

  function crear(usuario: Usuario = usuarioMock) {
    TestBed.inject(SessionService).setUserLoggedIn(usuario);
    const fixture = TestBed.createComponent(LayoutSidebar);
    fixture.detectChanges();
    return fixture;
  }

  async function navegar(fixture: ReturnType<typeof crear>, url: string) {
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('muestra el logo, los datos del usuario como v1 y el menú completo', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img')?.getAttribute('src')).toBe('assets/images/logo-sysfac.png');
    const usuario = el.querySelector('[data-testid="sidebar-usuario"]')?.textContent ?? '';
    expect(usuario.replace(/\s+/g, ' ')).toContain('admin - A B');
    expect(usuario).toContain('x');
    expect(el.querySelector('nav[aria-label="Menú principal"] p-panelmenu')).not.toBeNull();
    expect(el.textContent).toContain('Facturación');
    expect(el.textContent).toContain('Localizar unidades');
  });

  it('expande la sección activa tras navegar y pliega la anterior', async () => {
    const fixture = crear();
    await navegar(fixture, '/forms/facturacion/consulta');
    expect(fixture.componentInstance.seccionActiva()).toBe('facturacion');
    const el = fixture.nativeElement as HTMLElement;
    const header = el.querySelector('#facturacion_header');
    expect(header?.getAttribute('aria-expanded')).toBe('true');

    await navegar(fixture, '/forms/basic');
    expect(fixture.componentInstance.seccionActiva()).toBe('guias');
    expect(el.querySelector('#facturacion_header')?.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('#guias_header')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('abre la sección de la URL actual al crearse (p. ej. dentro del drawer)', async () => {
    await TestBed.inject(Router).navigateByUrl('/forms/liquidacion');
    const fixture = crear();
    expect(fixture.componentInstance.seccionActiva()).toBe('liquidacion');
  });

  it('usa una copia del menú: MENU_NEGOCIO no se muta', async () => {
    const fixture = crear();
    await navegar(fixture, '/forms/facturacion/consulta');
    const modelo = fixture.componentInstance.modelo();
    expect(modelo).not.toBe(MENU_NEGOCIO);
    expect(modelo.find((s) => s.id === 'facturacion')).not.toBe(MENU_NEGOCIO[3]);
    expect(MENU_NEGOCIO.some((s) => 'expanded' in s)).toBe(false);
  });

  it('el cargo Registrador no ve Facturación (como v1)', () => {
    const fixture = crear({ ...usuarioMock, cargo: 'Registrador' });
    const ids = fixture.componentInstance.modelo().map((s) => s.id);
    expect(ids).not.toContain('facturacion');
    expect(ids).toContain('guias');
  });

  it('emite enlaceSeleccionado al elegir un enlace', () => {
    const fixture = crear();
    let emitidos = 0;
    fixture.componentInstance.enlaceSeleccionado.subscribe(() => emitidos++);
    const guias = fixture.componentInstance.modelo().find((s) => s.id === 'guias');
    guias?.items?.[0].command?.({});
    expect(emitidos).toBe(1);
  });
});
