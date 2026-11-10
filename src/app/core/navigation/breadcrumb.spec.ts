import type { ActivatedRouteSnapshot } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { construirBreadcrumb } from './breadcrumb';

interface TramoFalso {
  url: string[];
  breadcrumb?: string;
  pantalla?: boolean;
  hijos?: boolean;
}

function snapshotDe(tramos: TramoFalso[]): ActivatedRouteSnapshot {
  const nodos = tramos.map(
    (t) =>
      ({
        url: t.url.map((path) => ({ path })),
        routeConfig: {
          data: t.breadcrumb ? { breadcrumb: t.breadcrumb } : undefined,
          ...(t.pantalla ? { loadComponent: () => Promise.resolve(class {}) } : {}),
          ...(t.hijos ? { loadChildren: () => Promise.resolve([]) } : {}),
        },
      }) as unknown as ActivatedRouteSnapshot,
  );
  const hoja = nodos[nodos.length - 1];
  (hoja as { pathFromRoot: ActivatedRouteSnapshot[] }).pathFromRoot = nodos;
  return hoja;
}

describe('construirBreadcrumb', () => {
  it('omite tramos sin breadcrumb y acumula la URL', () => {
    const items = construirBreadcrumb(
      snapshotDe([
        { url: [] },
        { url: ['forms'] },
        { url: ['facturacion'], breadcrumb: 'Facturación', hijos: true },
        { url: ['consulta'], breadcrumb: 'Consulta', pantalla: true },
      ]),
    );
    expect(items).toEqual([
      { label: 'Facturación' },
      { label: 'Consulta', routerLink: '/forms/facturacion/consulta' },
    ]);
  });

  it('un tramo con solo loadChildren no lleva routerLink', () => {
    const items = construirBreadcrumb(
      snapshotDe([{ url: ['x'], breadcrumb: 'Sección', hijos: true }]),
    );
    expect(items).toEqual([{ label: 'Sección' }]);
    expect('routerLink' in items[0]).toBe(false);
  });

  it('un tramo con pantalla lleva routerLink', () => {
    expect(
      construirBreadcrumb(
        snapshotDe([{ url: ['dashboard'], breadcrumb: 'Principal', pantalla: true }]),
      ),
    ).toEqual([{ label: 'Principal', routerLink: '/dashboard' }]);
  });

  it('sin ningún breadcrumb devuelve lista vacía', () => {
    expect(construirBreadcrumb(snapshotDe([{ url: ['a'] }]))).toEqual([]);
  });
});
