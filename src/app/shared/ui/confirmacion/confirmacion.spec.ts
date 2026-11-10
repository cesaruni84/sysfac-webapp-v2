import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmacionHost } from './confirmacion-host';
import {
  ConfirmacionService,
  ICONO_CONFIRMACION,
  ICONO_CONFIRMACION_PELIGRO,
  TEXTOS_CONFIRMACION,
} from './confirmacion.service';

describe('ConfirmacionService (sin host)', () => {
  it('envía al canal los textos por defecto en español', () => {
    const servicio = TestBed.inject(ConfirmacionService);
    const confirm = vi.spyOn(servicio.canal, 'confirm');
    void servicio.confirmar();
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Confirmación',
        message: '¿Está seguro?',
        acceptLabel: 'Aceptar',
        rejectLabel: 'Cancelar',
        icon: ICONO_CONFIRMACION,
        defaultFocus: 'accept',
      }),
    );
  });

  it('peligro: botón danger, ícono de alerta y foco en cancelar', () => {
    const servicio = TestBed.inject(ConfirmacionService);
    const confirm = vi.spyOn(servicio.canal, 'confirm');
    void servicio.confirmar({ mensaje: 'Eliminar', aceptar: 'Eliminar', peligro: true });
    const conf = confirm.mock.calls[0][0];
    expect(conf.acceptButtonProps).toMatchObject({ label: 'Eliminar', severity: 'danger' });
    expect(conf.icon).toBe(ICONO_CONFIRMACION_PELIGRO);
    expect(conf.defaultFocus).toBe('reject');
  });

  it('una confirmación nueva resuelve la anterior con false', async () => {
    const servicio = TestBed.inject(ConfirmacionService);
    const confirm = vi.spyOn(servicio.canal, 'confirm');
    const primera = servicio.confirmar({ mensaje: 'uno' });
    const segunda = servicio.confirmar({ mensaje: 'dos' });
    await expect(primera).resolves.toBe(false);
    confirm.mock.calls[1][0].accept?.();
    await expect(segunda).resolves.toBe(true);
  });
});

describe('ConfirmacionHost + ConfirmacionService', () => {
  let fixture: ComponentFixture<ConfirmacionHost>;
  let servicio: ConfirmacionService;

  const boton = (texto: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('.p-confirmdialog button')).find(
      (b) => b.textContent?.trim() === texto,
    );

  async function pintar() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmacionHost);
    servicio = TestBed.inject(ConfirmacionService);
    fixture.detectChanges();
  });

  it('muestra título y mensaje como texto plano y resuelve true al aceptar', async () => {
    const promesa = servicio.confirmar({
      titulo: 'Eliminar chofer',
      mensaje: 'Confirma eliminar el registro: <b>Juan</b>?',
    });
    await pintar();

    const dialogo = document.querySelector('.p-confirmdialog') as HTMLElement;
    expect(dialogo).not.toBeNull();
    expect(dialogo.textContent).toContain('Eliminar chofer');
    const mensaje = dialogo.querySelector('[data-testid="mensaje-confirmacion"]') as HTMLElement;
    expect(mensaje.textContent).toBe('Confirma eliminar el registro: <b>Juan</b>?');
    expect(mensaje.querySelector('b')).toBeNull();

    boton(TEXTOS_CONFIRMACION.aceptar)?.click();
    await expect(promesa).resolves.toBe(true);
  });

  it('resuelve false al cancelar', async () => {
    const promesa = servicio.confirmar({ cancelar: 'No' });
    await pintar();
    boton('No')?.click();
    await expect(promesa).resolves.toBe(false);
  });

  it('resuelve false al cerrar con Escape', async () => {
    const promesa = servicio.confirmar();
    await pintar();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    await expect(promesa).resolves.toBe(false);
  });
});
