import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';
import { CURRENT_USER_KEY } from './core/auth';
import { usuarioMock } from './core/auth/auth.testing';

/** URLs de negocio de v1 (privadas: protegidas por authGuard). */
const urlsPrivadas: [url: string, titulo: string][] = [
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
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  afterEach(() => localStorage.clear());

  it('/sessions/signin es pública', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/sessions/signin');
    expect(TestBed.inject(Router).url).toBe('/sessions/signin');
    expect(harness.routeNativeElement?.textContent).toContain('Iniciar sesión');
  });

  it.each([
    ['/sessions/404', 'Página no encontrada'],
    ['/sessions/error', 'Error'],
  ])('%s es pública y se muestra dentro del layout de autenticación', async (url, texto) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    expect(TestBed.inject(Router).url).toBe(url);
    const raiz = harness.fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('app-layout-auth')).not.toBeNull();
    expect(raiz.textContent).toContain(texto);
  });

  describe('con sesión', () => {
    beforeEach(() => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock)));

    it.each(urlsPrivadas)('resuelve %s', async (url, titulo) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe(url);
      expect(harness.routeNativeElement?.textContent).toContain(titulo);
    });

    // Enlaces del menú de usuario de v1 (Egret) que se conservan como redirecciones (4.2).
    it.each(['/profile/overview', '/profile/settings', '/profile/blank'])(
      '%s redirige a /profile',
      async (url) => {
        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl(url);
        expect(TestBed.inject(Router).url).toBe('/profile');
      },
    );
  });

  describe('sin sesión', () => {
    it.each(urlsPrivadas.map(([url]) => url))('%s redirige al login', async (url) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe('/sessions/signin');
    });
  });

  it('redirige la raíz a /sessions/signin', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/sessions/signin');
  });

  it.each(['/no-existe', '/forms/no-existe', '/sessions/no-existe'])(
    'redirige la URL desconocida %s a /sessions/404, como v1',
    async (url) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe('/sessions/404');
    },
  );
});
