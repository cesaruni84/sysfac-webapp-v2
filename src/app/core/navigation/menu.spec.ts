import type { MenuItem } from 'primeng/api';
import { describe, expect, it } from 'vitest';
import { MENU_NEGOCIO, crearMenuNegocio, filtrarMenuPorCargo } from './menu';

describe('filtrarMenuPorCargo', () => {
  it('Registrador no ve "Facturación" (regla de v1)', () => {
    const menu = crearMenuNegocio();
    const filtrado = filtrarMenuPorCargo(menu, 'Registrador');
    expect(filtrado.map((i) => i.label)).not.toContain('Facturación');
    expect(filtrado).toHaveLength(MENU_NEGOCIO.length - 1);
    expect(menu).toHaveLength(MENU_NEGOCIO.length);
  });

  it.each(['Administrador', 'registrador', '', null, undefined])(
    'el cargo %s ve el menú completo',
    (cargo) => {
      const menu = crearMenuNegocio();
      const filtrado = filtrarMenuPorCargo(menu, cargo);
      expect(filtrado).toEqual(menu);
      expect(filtrado).not.toBe(menu);
      expect(filtrado[1]).toBe(menu[1]);
    },
  );
});

function enlaces(items: readonly MenuItem[]): string[] {
  return items.flatMap((i) => [
    ...(typeof i.routerLink === 'string' ? [i.routerLink] : []),
    ...enlaces(i.items ?? []),
  ]);
}

describe('MENU_NEGOCIO', () => {
  it('conserva secciones, orden y etiquetas de v1', () => {
    expect(MENU_NEGOCIO.map((i) => i.label)).toEqual([
      'Principal',
      'Guías de Remisión',
      'Liquidación',
      'Facturación',
      'Configuración',
      'Usuarios',
      'Localizar unidades',
    ]);
    const sub = (label: string) =>
      MENU_NEGOCIO.find((i) => i.label === label)?.items?.map((i) => i.label);
    expect(sub('Guías de Remisión')).toEqual(['Registro', 'Consulta']);
    expect(sub('Liquidación')).toEqual(['Registro', 'Consulta']);
    expect(sub('Facturación')).toEqual([
      'Registro',
      'Consulta',
      'Auditoría',
      'Factura Electrónica',
    ]);
    expect(sub('Configuración')).toEqual([
      'Plantas',
      'Tarifas',
      'Choferes',
      'Vehículos',
      'Productos',
      'Clientes',
    ]);
  });

  it('Factura Electrónica está deshabilitada y sin routerLink', () => {
    const fe = MENU_NEGOCIO.find((i) => i.label === 'Facturación')?.items?.at(-1);
    expect(fe?.label).toBe('Factura Electrónica');
    expect(fe?.disabled).toBe(true);
    expect(fe?.routerLink).toBeUndefined();
  });

  it('los ids son únicos', () => {
    const ids = MENU_NEGOCIO.flatMap((i) => [i.id, ...(i.items ?? []).map((s) => s.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hay 16 enlaces', () => {
    expect(enlaces(MENU_NEGOCIO)).toHaveLength(16);
  });
});

describe('crearMenuNegocio', () => {
  it('devuelve copias independientes en cada llamada', () => {
    const a = crearMenuNegocio();
    const b = crearMenuNegocio();
    expect(a).not.toBe(b);
    expect(a[1]).not.toBe(b[1]);
    expect(a).toEqual(b);
    a[1].expanded = true;
    a[1].items![0].label = 'X';
    expect(b[1].expanded).toBeUndefined();
    expect(b[1].items![0].label).toBe('Registro');
    expect(crearMenuNegocio()[1].items![0].label).toBe('Registro');
    expect(MENU_NEGOCIO[1].expanded).toBeUndefined();
  });
});
