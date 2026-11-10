import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CargaGlobalService } from '../../../core/carga';
import { Cargando } from './cargando';
import { CargandoGlobal } from './cargando-global';

describe('Cargando (inline)', () => {
  it('muestra el spinner y el mensaje con role=status', () => {
    const fixture = TestBed.createComponent(Cargando);
    fixture.componentRef.setInput('mensaje', 'Cargando clientes');
    fixture.componentRef.setInput('tamano', 'pequeno');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.querySelector('p-progressspinner')).not.toBeNull();
    expect(el.querySelector('[data-testid="mensaje-cargando"]')?.textContent).toBe('Cargando clientes');
  });

  it('sin mensaje no pinta el texto', () => {
    const fixture = TestBed.createComponent(Cargando);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="mensaje-cargando"]')).toBeNull();
  });
});

describe('CargandoGlobal (overlay)', () => {
  it('aparece mientras haya aperturas y desaparece con el último cierre', () => {
    const fixture = TestBed.createComponent(CargandoGlobal);
    const carga = TestBed.inject(CargaGlobalService);
    const el = fixture.nativeElement as HTMLElement;
    const overlay = () => el.querySelector('[data-testid="cargando-global"]');

    fixture.detectChanges();
    expect(overlay()).toBeNull();

    carga.abrir();
    carga.abrir('Guardando factura');
    fixture.detectChanges();
    expect(overlay()).not.toBeNull();
    expect(el.querySelector('[data-testid="mensaje-cargando-global"]')?.textContent?.trim()).toBe(
      'Guardando factura',
    );

    carga.cerrar();
    fixture.detectChanges();
    expect(overlay()).not.toBeNull();
    expect(el.querySelector('[data-testid="mensaje-cargando-global"]')?.textContent?.trim()).toBe(
      'Procesando',
    );

    carga.cerrar();
    fixture.detectChanges();
    expect(overlay()).toBeNull();
  });
});
