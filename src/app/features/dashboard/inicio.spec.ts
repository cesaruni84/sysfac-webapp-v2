import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../core/auth';
import { usuarioMock } from '../../core/auth/auth.testing';
import type { Usuario } from '../../core/models';
import {
  CARGO_REGISTRADOR,
  MENU_NEGOCIO,
  crearMenuNegocio,
  filtrarMenuPorCargo,
} from '../../core/navigation';
import { Inicio, crearAccesos, empresaConRuc, nombreCompleto } from './inicio';

/** URLs esperadas, derivadas del mismo menú que usa el sidebar. */
function urlsEsperadas(cargo: string): string[] {
  return filtrarMenuPorCargo(crearMenuNegocio(), cargo)
    .filter((i) => i.id !== 'principal')
    .flatMap((i) => (i.items?.length ? i.items : [i]))
    .filter((i) => !i.disabled)
    .map((i) => i.routerLink as string);
}

describe('Inicio', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

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
  });

  it('muestra la fecha en español con mayúscula inicial', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 12));
    const el = crear({ nombres: 'Ana' });
    expect(texto(el, 'inicio-fecha')).toBe('martes, 10 de noviembre de 2026');
    expect(el.querySelector('[data-testid="inicio-fecha"]')?.classList).toContain(
      'first-letter:uppercase',
    );
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

  it.each(['Administrador', CARGO_REGISTRADOR])(
    'los enlaces coinciden con el menú (%s)',
    (cargo) => {
      const el = crear({ cargo });
      expect(hrefs(el)).toEqual(urlsEsperadas(cargo));
    },
  );

  it('Factura Electrónica sale sin enlace', () => {
    const el = crear({ cargo: 'Administrador' });
    expect(el.textContent).toContain('Factura Electrónica (no disponible)');
  });

  it('sin sesión muestra un aviso', () => {
    const el = crear();
    expect(texto(el, 'inicio-sin-sesion')).toContain('No hay una sesión activa');
    expect(el.querySelectorAll('a')).toHaveLength(0);
  });
});

describe('funciones puras', () => {
  const emp = (e: Record<string, string>) => ({ empresa: e }) as unknown as Usuario;

  it('empresaConRuc: comercial primero, razón social de respaldo', () => {
    expect(empresaConRuc(emp({ comercial: 'C', ruc: '1' }))).toBe('C - RUC 1');
    expect(empresaConRuc(emp({ razonSocial: 'R', ruc: '1' }))).toBe('R - RUC 1');
    expect(empresaConRuc(emp({ comercial: 'C', razonSocial: 'R', ruc: '1' }))).toBe('C - RUC 1');
    expect(empresaConRuc(emp({ comercial: 'C' }))).toBe('C');
    expect(empresaConRuc(null)).toBe('');
  });

  it('nombreCompleto omite partes vacías o nulas', () => {
    const u = (nombres: unknown, apellidos: unknown) => ({ nombres, apellidos }) as Usuario;
    expect(nombreCompleto(u('Ana', 'Pérez'))).toBe('Ana Pérez');
    expect(nombreCompleto(u('Ana', null))).toBe('Ana');
    expect(nombreCompleto(u(undefined, ' '))).toBe('');
    expect(nombreCompleto(null)).toBe('');
  });

  it('crearAccesos excluye Principal (por id o por /dashboard)', () => {
    const menu: MenuItem[] = [
      { id: 'otro', label: 'Inicio', routerLink: '/dashboard' },
      ...crearMenuNegocio(),
    ];
    const accesos = crearAccesos(menu);
    expect(accesos.map((a) => a.label)).not.toContain('Principal');
    expect(accesos.map((a) => a.label)).not.toContain('Inicio');
    expect(accesos).toHaveLength(6);
  });

  it('cada sección del menú tiene descripción', () => {
    const accesos = crearAccesos(structuredClone(MENU_NEGOCIO) as MenuItem[]);
    expect(accesos.length).toBeGreaterThan(0);
    for (const a of accesos) expect(a.descripcion, a.id).not.toBe('');
  });
});
