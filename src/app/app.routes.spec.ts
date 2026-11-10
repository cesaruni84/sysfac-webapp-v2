import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

/** Todas las URLs de negocio de v1 deben resolver en v2. */
const urlsDeV1: [url: string, titulo: string][] = [
  ['/sessions/signin', 'Iniciar sesión'],
  ['/dashboard', 'Principal'],
  ['/forms/basic', 'Registro de guías'],
  ['/forms/paging', 'Consulta de guías'],
  ['/forms/liquidacion', 'Registro de liquidación'],
  ['/forms/busquedaLiquidaciones', 'Consulta de liquidaciones'],
  ['/forms/facturacion/registro', 'Registro de factura'],
  ['/forms/facturacion/consulta', 'Consulta de facturas'],
  ['/forms/facturacion/auditoria', 'Auditoría de facturas'],
  ['/forms/configuracion/factorias', 'Plantas'],
  ['/forms/configuracion/tarifas', 'Tarifas'],
  ['/forms/configuracion/choferes', 'Choferes'],
  ['/forms/configuracion/vehiculos', 'Vehículos'],
  ['/forms/configuracion/productos', 'Productos'],
  ['/forms/configuracion/clientes', 'Clientes'],
  ['/profile', 'Usuarios'],
  ['/map', 'Localizar unidades'],
];

describe('app.routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  it.each(urlsDeV1)('resuelve %s', async (url, titulo) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    expect(TestBed.inject(Router).url).toBe(url);
    expect(harness.routeNativeElement?.textContent).toContain(titulo);
  });

  it('redirige la raíz a /sessions/signin', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/sessions/signin');
  });

  it('redirige una URL desconocida a /sessions/signin', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no-existe');
    expect(TestBed.inject(Router).url).toBe('/sessions/signin');
  });
});
