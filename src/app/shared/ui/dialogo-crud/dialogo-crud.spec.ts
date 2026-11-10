import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DialogoCrud } from './dialogo-crud';

@Component({
  imports: [DialogoCrud],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialogo-crud
      [(visible)]="visible"
      titulo="Nuevo Chofer"
      icono="pi pi-user"
      [guardando]="guardando()"
      [guardarDeshabilitado]="invalido()"
      (guardar)="guardados.set(guardados() + 1)"
      (cancelar)="cancelados.set(cancelados() + 1)"
    >
      <p data-testid="contenido">Formulario del chofer</p>
    </app-dialogo-crud>
  `,
})
class Anfitrion {
  readonly visible = signal(true);
  readonly guardando = signal(false);
  readonly invalido = signal(false);
  readonly guardados = signal(0);
  readonly cancelados = signal(0);
}

describe('DialogoCrud', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let anfitrion: Anfitrion;

  const dialogo = () => document.querySelector('.p-dialog') as HTMLElement | null;
  const boton = (id: string) =>
    document.querySelector<HTMLButtonElement>(`[data-testid="${id}"] button`) as HTMLButtonElement;

  async function pintar() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Anfitrion);
    anfitrion = fixture.componentInstance;
    await pintar();
  });

  it('muestra título, ícono, contenido proyectado y los botones', () => {
    expect(dialogo()).not.toBeNull();
    expect(dialogo()?.querySelector('[data-testid="titulo-dialogo"]')?.textContent?.trim()).toBe(
      'Nuevo Chofer',
    );
    expect(dialogo()?.querySelector('i.pi-user')).not.toBeNull();
    expect(dialogo()?.querySelector('[data-testid="contenido"]')?.textContent).toBe(
      'Formulario del chofer',
    );
    expect(boton('boton-guardar').textContent).toContain('Guardar');
    expect(boton('boton-cancelar').textContent).toContain('Cancelar');
  });

  it('Guardar emite (guardar) y no cierra', async () => {
    boton('boton-guardar').click();
    await pintar();
    expect(anfitrion.guardados()).toBe(1);
    expect(anfitrion.visible()).toBe(true);
  });

  it('Cancelar cierra (visible=false) y emite (cancelar)', async () => {
    boton('boton-cancelar').click();
    await pintar();
    expect(anfitrion.visible()).toBe(false);
    expect(anfitrion.cancelados()).toBe(1);
  });

  it('guardarDeshabilitado deshabilita solo Guardar', async () => {
    anfitrion.invalido.set(true);
    await pintar();
    expect(boton('boton-guardar').disabled).toBe(true);
    expect(boton('boton-cancelar').disabled).toBe(false);
    boton('boton-guardar').click();
    expect(anfitrion.guardados()).toBe(0);
  });

  it('guardando deshabilita ambos botones, muestra spinner y oculta la X', async () => {
    anfitrion.guardando.set(true);
    await pintar();
    expect(boton('boton-guardar').disabled).toBe(true);
    expect(boton('boton-cancelar').disabled).toBe(true);
    expect(dialogo()?.querySelector('[data-testid="boton-guardar"] .p-button-loading-icon, [data-testid="boton-guardar"] [data-p-icon="spinner"]')).not.toBeNull();
    expect(dialogo()?.querySelector('button[aria-label="Cerrar"]')).toBeNull();
  });

  it('la X de la cabecera cierra y emite (cancelar)', async () => {
    const x = dialogo()?.querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]');
    expect(x).not.toBeNull();
    x?.click();
    await pintar();
    expect(anfitrion.visible()).toBe(false);
    expect(anfitrion.cancelados()).toBe(1);
  });
});
