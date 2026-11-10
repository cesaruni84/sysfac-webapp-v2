import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { CURRENT_USER_KEY } from '../auth/session.service';
import { usuarioMock } from '../auth/auth.testing';
import { construirBreadcrumb } from './breadcrumb';

describe('construirBreadcrumb', () => {
  beforeEach(() => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock));
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  async function snapshotDe(url: string): Promise<ActivatedRouteSnapshot> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    let s = TestBed.inject(Router).routerState.snapshot.root;
    while (s.firstChild) s = s.firstChild;
    return s;
  }

  it('/dashboard', async () => {
    expect(construirBreadcrumb(await snapshotDe('/dashboard'))).toEqual([
      { label: 'Principal', routerLink: '/dashboard' },
    ]);
  });

  it('/forms/facturacion/consulta termina en la hoja con su enlace completo', async () => {
    const items = construirBreadcrumb(await snapshotDe('/forms/facturacion/consulta'));
    expect(items.at(-1)).toEqual({ label: 'Consulta', routerLink: '/forms/facturacion/consulta' });
  });

  it('/forms/configuracion/choferes', async () => {
    const items = construirBreadcrumb(await snapshotDe('/forms/configuracion/choferes'));
    expect(items.at(-1)).toEqual({
      label: 'Choferes',
      routerLink: '/forms/configuracion/choferes',
    });
  });

  it('omite tramos sin breadcrumb y acumula la URL', () => {
    const tramo = (url: string[], breadcrumb?: string) =>
      ({
        url: url.map((path) => ({ path })),
        routeConfig: breadcrumb ? { data: { breadcrumb } } : null,
      }) as unknown as ActivatedRouteSnapshot;
    const raiz = tramo([]);
    const forms = tramo(['forms']);
    const fact = tramo(['facturacion'], 'Facturación');
    const hoja = tramo(['consulta'], 'Consulta');
    (hoja as { pathFromRoot: ActivatedRouteSnapshot[] }).pathFromRoot = [raiz, forms, fact, hoja];
    expect(construirBreadcrumb(hoja)).toEqual([
      { label: 'Facturación', routerLink: '/forms/facturacion' },
      { label: 'Consulta', routerLink: '/forms/facturacion/consulta' },
    ]);
  });
});
