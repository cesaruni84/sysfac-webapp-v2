import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { MenuItem } from 'primeng/api';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { CURRENT_USER_KEY } from '../auth/session.service';
import { usuarioMock } from '../auth/auth.testing';
import { MENU_NEGOCIO } from './menu';

function enlaces(items: MenuItem[]): string[] {
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
    expect(sub('Facturación')).toEqual(['Registro', 'Consulta', 'Auditoría', 'Factura Electrónica']);
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

  describe('routerLink', () => {
    beforeEach(() => {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock));
      TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    });

    const todos = enlaces(MENU_NEGOCIO);

    it('hay 16 enlaces', () => {
      expect(todos).toHaveLength(16);
    });

    it.each(todos)('%s resuelve a una ruta existente', async (url) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe(url);
    });
  });
});
