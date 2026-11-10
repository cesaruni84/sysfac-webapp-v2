import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../core/auth';
import { usuarioMock } from '../../core/auth/auth.testing';
import { NotificacionService } from '../../core/notifications';
import { DURACION_TOAST, LayoutShell } from './shell';

@Component({ template: '<p>Contenido de la pantalla</p>' })
class Pantalla {}

describe('LayoutShell', () => {
  let fixture: ComponentFixture<LayoutShell>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        // El fixture hace de ruta padre: su router-outlet pinta estas rutas.
        provideRouter([
          { path: 'dashboard', data: { breadcrumb: 'Principal' }, component: Pantalla },
          { path: 'forms/basic', data: { breadcrumb: 'Registro' }, component: Pantalla },
        ]),
      ],
    });
    TestBed.inject(SessionService).setUserLoggedIn(usuarioMock);
    fixture = TestBed.createComponent(LayoutShell);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('renderiza header, sidebar, breadcrumb, main con router-outlet y el toast', () => {
    expect(el.querySelector('app-layout-header header')).not.toBeNull();
    expect(el.querySelector('aside app-layout-sidebar nav[aria-label="Menú principal"]')).not.toBeNull();
    expect(el.querySelector('main#contenido app-layout-breadcrumb')).not.toBeNull();
    expect(el.querySelector('main#contenido router-outlet')).not.toBeNull();
    expect(el.querySelector('p-toast')).not.toBeNull();
    expect(el.querySelector('a[href="#contenido"]')?.textContent).toContain('Saltar al contenido');
  });

  it('el botón de escritorio pliega y despliega el sidebar fijo', () => {
    const boton = () =>
      el.querySelector<HTMLButtonElement>('button[aria-label$="menú lateral"]') as HTMLButtonElement;
    expect(el.querySelector('[data-testid="sidebar-escritorio"]')).not.toBeNull();
    expect(boton().getAttribute('aria-label')).toBe('Ocultar menú lateral');
    boton().click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="sidebar-escritorio"]')).toBeNull();
    expect(boton().getAttribute('aria-label')).toBe('Mostrar menú lateral');
    boton().click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="sidebar-escritorio"]')).not.toBeNull();
  });

  it('el botón móvil abre el drawer y se cierra al navegar', async () => {
    el.querySelector<HTMLButtonElement>('button[aria-label="Abrir menú"]')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.drawerVisible()).toBe(true);
    await TestBed.inject(Router).navigateByUrl('/forms/basic');
    fixture.detectChanges();
    expect(fixture.componentInstance.drawerVisible()).toBe(false);
    expect(el.querySelector('main')?.textContent).toContain('Contenido de la pantalla');
  });

  it('convierte cada aviso de NotificacionService en MessageService.add', () => {
    const mensajes = fixture.debugElement.injector.get(MessageService);
    const add = vi.spyOn(mensajes, 'add');
    const avisos = TestBed.inject(NotificacionService);
    avisos.error('Error del servidor', 'Detalle');
    avisos.exito('Guardado');
    expect(add).toHaveBeenNthCalledWith(1, {
      severity: 'error',
      summary: 'Error del servidor',
      detail: 'Detalle',
    });
    expect(add).toHaveBeenNthCalledWith(2, {
      severity: 'success',
      summary: 'Guardado',
      detail: undefined,
    });
  });

  it('el toast muestra el aviso en pantalla', async () => {
    TestBed.inject(NotificacionService).advertencia('Atención', 'Revise los datos');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('p-toast')?.textContent).toContain('Revise los datos');
    expect(DURACION_TOAST).toBeGreaterThan(0);
  });

  it('deja de escuchar avisos al destruirse', () => {
    const add = vi.spyOn(fixture.debugElement.injector.get(MessageService), 'add');
    fixture.destroy();
    TestBed.inject(NotificacionService).info('tarde');
    expect(add).not.toHaveBeenCalled();
  });
});
