import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { MenuItem } from 'primeng/api';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { usuarioMock } from './core/auth/auth.testing';
import { CURRENT_USER_KEY } from './core/auth/session.service';
import { MENU_NEGOCIO, construirBreadcrumb } from './core/navigation';
import { provideHttpVacio } from './testing/http-vacio';

function enlaces(items: readonly MenuItem[]): string[] {
  return items.flatMap((i) => [
    ...(typeof i.routerLink === 'string' ? [i.routerLink] : []),
    ...enlaces(i.items ?? []),
  ]);
}

// Timeout amplio: cada navegación carga de verdad los chunks diferidos (arranque en frío).
describe('navegación a nivel de app', { timeout: 20_000 }, () => {
  beforeEach(() => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock));
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpVacio()] });
  });

  async function snapshotDe(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    let s = TestBed.inject(Router).routerState.snapshot.root;
    while (s.firstChild) s = s.firstChild;
    return s;
  }

  describe('routerLink del menú', () => {
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

  describe('breadcrumb', () => {
    it.each([
      ['/dashboard', [{ label: 'Principal', routerLink: '/dashboard' }]],
      [
        '/forms/facturacion/consulta',
        [
          { label: 'Facturación' },
          { label: 'Consulta', routerLink: '/forms/facturacion/consulta' },
        ],
      ],
      [
        '/forms/configuracion/choferes',
        [
          { label: 'Configuración' },
          { label: 'Choferes', routerLink: '/forms/configuracion/choferes' },
        ],
      ],
      [
        '/forms/basic',
        [{ label: 'Guías de Remisión' }, { label: 'Registro', routerLink: '/forms/basic' }],
      ],
      [
        '/forms/busquedaLiquidaciones',
        [
          { label: 'Liquidación' },
          { label: 'Consulta', routerLink: '/forms/busquedaLiquidaciones' },
        ],
      ],
    ])('%s', async (url, esperado) => {
      expect(construirBreadcrumb(await snapshotDe(url))).toEqual(esperado);
    });
  });
});
