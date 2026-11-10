import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, Routes, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { LayoutBreadcrumb, ajustarMigas } from './breadcrumb';

@Component({ template: '' })
class Vacia {}

/** Misma forma que app.routes.ts + features (secciones sin pantalla y hojas con pantalla). */
const rutas: Routes = [
  {
    path: '',
    children: [
      { path: 'dashboard', data: { breadcrumb: 'Principal' }, component: Vacia },
      {
        path: 'forms',
        children: [
          {
            path: 'facturacion',
            data: { breadcrumb: 'Facturación' },
            children: [{ path: 'consulta', data: { breadcrumb: 'Consulta' }, component: Vacia }],
          },
          {
            path: '',
            data: { breadcrumb: 'Guías de Remisión' },
            children: [{ path: 'basic', data: { breadcrumb: 'Registro' }, component: Vacia }],
          },
        ],
      },
    ],
  },
];

describe('ajustarMigas', () => {
  const migas = [
    { label: 'A', routerLink: '/a' },
    { label: 'B', routerLink: '/a/b' },
  ];

  it('quita el enlace solo de la última miga', () => {
    expect(ajustarMigas(migas, '/a/b')).toEqual([{ label: 'A', routerLink: '/a' }, { label: 'B' }]);
    expect(migas[1].routerLink).toBe('/a/b');
  });

  it.each(['/dashboard', '/dashboard/', '/dashboard?x=1', '/dashboard#y'])(
    'en %s no hay migas',
    (url) => expect(ajustarMigas([{ label: 'Principal', routerLink: '/dashboard' }], url)).toEqual([]),
  );

  it('sin migas devuelve vacío', () => expect(ajustarMigas([], '/x')).toEqual([]));
});

describe('LayoutBreadcrumb', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(rutas)] });
  });

  async function navegar(url: string) {
    const fixture = TestBed.createComponent(LayoutBreadcrumb);
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('/forms/facturacion/consulta → "Facturación" > "Consulta", ambas sin enlace', async () => {
    const fixture = await navegar('/forms/facturacion/consulta');
    expect(fixture.componentInstance.migas()).toEqual([
      { label: 'Facturación' },
      { label: 'Consulta' },
    ]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Facturación');
    expect(el.textContent).toContain('Consulta');
    // Solo el icono de inicio es un enlace navegable.
    const enlaces = Array.from(el.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual(['/dashboard']);
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Ruta de navegación');
  });

  it('/dashboard → sin migas ni separador, solo el icono de inicio', async () => {
    const fixture = await navegar('/dashboard');
    expect(fixture.componentInstance.migas()).toEqual([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Principal');
    expect(el.querySelector('.p-breadcrumb-separator')).toBeNull();
    expect(el.querySelector('.pi-home')).not.toBeNull();
  });

  it('se recalcula al navegar (sección de /forms sin path)', async () => {
    const fixture = await navegar('/forms/facturacion/consulta');
    await TestBed.inject(Router).navigateByUrl('/forms/basic');
    fixture.detectChanges();
    expect(fixture.componentInstance.migas()).toEqual([
      { label: 'Guías de Remisión' },
      { label: 'Registro' },
    ]);
  });
});
