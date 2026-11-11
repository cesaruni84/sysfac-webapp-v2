import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SessionService } from '../../core/auth';
import { usuarioMock } from '../../core/auth/auth.testing';
import type { Usuario } from '../../core/models';
import { CARGO_REGISTRADOR } from '../../core/navigation';
import { Inicio } from './inicio';

describe('Inicio', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => localStorage.clear());

  function crear(usuario?: Partial<Usuario>) {
    if (usuario) {
      TestBed.inject(SessionService).setUserLoggedIn({ ...usuarioMock, ...usuario } as Usuario);
    }
    const fixture = TestBed.createComponent(Inicio);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const texto = (el: HTMLElement, id: string) =>
    (el.querySelector(`[data-testid="${id}"]`)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const titulos = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim());
  const hrefs = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));

  it('saluda con nombre, empresa con RUC y fecha', () => {
    const el = crear({
      nombres: 'Ana',
      apellidos: 'Pérez',
      empresa: { id: 1, razonSocial: 'ACME SAC', ruc: '20123456789' } as Usuario['empresa'],
    });
    expect(el.querySelector('h1')).not.toBeNull();
    expect(texto(el, 'inicio-saludo')).toBe('Bienvenido, Ana Pérez');
    expect(texto(el, 'inicio-empresa')).toBe('ACME SAC - RUC 20123456789');
    expect(texto(el, 'inicio-fecha')).not.toBe('');
  });

  it('no muestra null si faltan apellidos', () => {
    const el = crear({ nombres: 'Ana', apellidos: null as unknown as string });
    expect(texto(el, 'inicio-saludo')).toBe('Bienvenido, Ana');
    expect(el.textContent).not.toContain('null');
  });

  it('muestra todos los accesos a un cargo normal, sin "Principal"', () => {
    const el = crear({ cargo: 'Administrador' });
    expect(titulos(el)).toEqual([
      'Guías de Remisión',
      'Liquidación',
      'Facturación',
      'Configuración',
      'Usuarios',
      'Localizar unidades',
    ]);
    expect(hrefs(el)).not.toContain('/dashboard');
  });

  it('un registrador ve menos accesos (sin Facturación)', () => {
    const el = crear({ cargo: CARGO_REGISTRADOR });
    expect(titulos(el)).not.toContain('Facturación');
    expect(titulos(el)).toHaveLength(5);
    expect(hrefs(el).some((h) => h?.includes('facturacion'))).toBe(false);
  });

  it('los enlaces apuntan a las URLs del menú', () => {
    const el = crear({ cargo: 'Administrador' });
    expect(hrefs(el)).toEqual(
      expect.arrayContaining([
        '/forms/basic',
        '/forms/paging',
        '/forms/liquidacion',
        '/forms/facturacion/registro',
        '/forms/configuracion/clientes',
        '/profile',
        '/map',
      ]),
    );
    expect(el.textContent).toContain('Factura Electrónica (no disponible)');
  });

  it('sin sesión muestra un aviso', () => {
    const el = crear();
    expect(texto(el, 'inicio-sin-sesion')).toContain('No hay una sesión activa');
    expect(el.querySelectorAll('a')).toHaveLength(0);
  });
});
