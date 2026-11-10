import { describe, expect, it, vi } from 'vitest';

import { crearMenuNegocio } from '../../core/navigation';
import { alElegirEnlace, coincideEnlace, expandirSeccionActiva } from './menu-activo';

describe('coincideEnlace', () => {
  it.each([
    ['/forms/basic', '/forms/basic', true],
    ['/forms/basic', '/forms/basic?x=1', true],
    ['/forms/basic', '/forms/basic#a', true],
    ['/forms/basic', '/forms/basic/123', true],
    ['/forms/basic', '/forms/basicos', false],
    ['/forms/basic', '/forms', false],
    [undefined, '/forms', false],
    ['', '/forms', false],
  ])('%s vs %s → %s', (enlace, url, esperado) => {
    expect(coincideEnlace(enlace, url)).toBe(esperado);
  });
});

describe('expandirSeccionActiva', () => {
  it.each([
    ['/forms/basic', 'guias'],
    ['/forms/paging', 'guias'],
    ['/forms/liquidacion', 'liquidacion'],
    ['/forms/busquedaLiquidaciones', 'liquidacion'],
    ['/forms/facturacion/consulta', 'facturacion'],
    ['/forms/configuracion/clientes', 'configuracion'],
  ])('%s abre solo la sección %s', (url, id) => {
    const menu = crearMenuNegocio();
    expect(expandirSeccionActiva(menu, url)?.id).toBe(id);
    const abiertas = menu.filter((s) => s.expanded).map((s) => s.id);
    expect(abiertas).toEqual([id]);
  });

  it('una URL sin sección (dashboard) pliega todas', () => {
    const menu = crearMenuNegocio();
    menu[1].expanded = true;
    expect(expandirSeccionActiva(menu, '/dashboard')).toBeUndefined();
    expect(menu.some((s) => s.expanded)).toBe(false);
  });
});

describe('alElegirEnlace', () => {
  it('asigna command solo a ítems con routerLink, en todos los niveles', () => {
    const accion = vi.fn();
    const menu = alElegirEnlace(crearMenuNegocio(), accion);
    const principal = menu.find((s) => s.id === 'principal');
    const facturacion = menu.find((s) => s.id === 'facturacion');
    expect(facturacion?.command).toBeUndefined();
    expect(facturacion?.items?.at(-1)?.command).toBeUndefined(); // Factura Electrónica, sin enlace
    principal?.command?.({});
    facturacion?.items?.[0].command?.({});
    expect(accion).toHaveBeenCalledTimes(2);
  });
});
