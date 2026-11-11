import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import { usuarioMock } from '../../../core/auth/auth.testing';
import type { Factoria, TarifaRuta } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { FactoriaService, TarifaRutaService } from '../../../core/services';
import { ConfirmacionService } from '../../../shared/ui';
import { ID_EMPRESA_LISTADO, MaestroTarifas, MENSAJE_ERROR_GENERICO } from './maestro-tarifas';

const lima: Factoria = { id: 1, refLarga2: 'PLANTA LIMA', direccion: 'Av. Lima 1' };
const callao: Factoria = { id: 2, refLarga2: 'PLANTA CALLAO', direccion: 'Av. Callao 2' };

const datos: TarifaRuta[] = [
  { id: 10, origen: lima, destino: callao, importe: 150.5, moneda: 1, estado: 0, notas: 'n', empresa: usuarioMock.empresa },
  { id: 11, origen: callao, destino: lima, importe: 90, moneda: 2, estado: 1, empresa: usuarioMock.empresa },
];

describe('MaestroTarifas', () => {
  let fixture: ComponentFixture<MaestroTarifas>;
  let comp: MaestroTarifas;
  const listarTodasLasTarifasPorEmpresa = vi.fn();
  const registrarTarifa = vi.fn();
  const actualizarTarifa = vi.fn();
  const eliminarTarifa = vi.fn();
  const listarComboFactorias = vi.fn();
  const confirmar = vi.fn();
  const error = vi.fn();
  const exito = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    localStorage.clear();
    listarTodasLasTarifasPorEmpresa.mockReturnValue(of(datos));
    listarComboFactorias.mockReturnValue(of([lima, callao]));
    registrarTarifa.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    actualizarTarifa.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    eliminarTarifa.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Tarifa eliminada' }));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TarifaRutaService,
          useValue: { listarTodasLasTarifasPorEmpresa, registrarTarifa, actualizarTarifa, eliminarTarifa },
        },
        { provide: FactoriaService, useValue: { listarComboFactorias } },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: { error, exito } },
      ],
    });
    TestBed.inject(SessionService).setUserLoggedIn(usuarioMock);
    fixture = TestBed.createComponent(MaestroTarifas);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('carga tarifas (empresa 1 como v1) y el combo de factorías', () => {
    expect(listarTodasLasTarifasPorEmpresa).toHaveBeenCalledWith(ID_EMPRESA_LISTADO);
    expect(listarComboFactorias).toHaveBeenCalledWith('O');
    expect(comp.tarifas()).toEqual(datos);
    expect(comp.factorias()).toEqual([lima, callao]);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('PLANTA LIMA');
    expect(texto).toContain('150.50');
    expect(texto).toContain('Vigente');
    expect(texto).toContain('Inactivo');
  });

  it('combos dependientes: elegir origen/destino rellena la dirección', () => {
    comp.abrir();
    expect(comp.form.controls.estado.value).toBe(true);
    comp.form.controls.origen.setValue(lima);
    comp.seleccionarOrigen(lima);
    comp.form.controls.destino.setValue(callao);
    comp.seleccionarDestino(callao);
    expect(comp.form.controls.direOrigen.value).toBe('Av. Lima 1');
    expect(comp.form.controls.direDestino.value).toBe('Av. Callao 2');
    expect(comp.form.controls.direOrigen.disabled).toBe(true);
  });

  it('campos obligatorios tocados y vacíos quedan con aria-invalid y muestran el mensaje', async () => {
    comp.abrir();
    comp.form.markAllAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const importe = document.querySelector('#importe') as HTMLElement;
    expect(importe.getAttribute('aria-invalid')).toBe('true');
    expect(importe.getAttribute('aria-describedby')).toBe('importe-error');
    expect(document.getElementById('importe-error')?.textContent).toContain('REQUERIDO');
    const origen = document.querySelector('[data-testid="origen"] [aria-invalid="true"]');
    expect(origen?.getAttribute('aria-describedby')).toBe('origen-error');
    expect(document.getElementById('origen-error')?.textContent).toContain('REQUERIDO');
  });

  it('el alta envía el JSON de v1 (empresa de sesión, turno 1, estado 0 si activo)', async () => {
    comp.abrir();
    expect(comp.form.invalid).toBe(true);
    comp.form.patchValue({ origen: lima, destino: callao, importe: 200, moneda: 1, notas: 'x' });
    await comp.guardar();
    expect(registrarTarifa).toHaveBeenCalledWith({
      origen: lima,
      destino: callao,
      importe: 200,
      moneda: 1,
      notas: 'x',
      empresa: usuarioMock.empresa,
      turno: { id: 1 },
      estado: 0,
    });
    expect(exito).toHaveBeenCalledWith('Registro añadido correctamente !');
    expect(comp.dialogoVisible()).toBe(false);
    expect(listarTodasLasTarifasPorEmpresa).toHaveBeenCalledTimes(2);
  });

  it('la edición precarga (activo si estado == 0), envía id y estado 1 al desactivar', async () => {
    comp.alAccion({ accion: 'editar', fila: datos[0] });
    expect(comp.form.getRawValue()).toMatchObject({
      origen: lima,
      direOrigen: 'Av. Lima 1',
      direDestino: 'Av. Callao 2',
      importe: 150.5,
      moneda: 1,
      estado: true,
    });
    comp.form.patchValue({ estado: false });
    await comp.guardar();
    expect(actualizarTarifa).toHaveBeenCalledWith({
      origen: lima,
      destino: callao,
      importe: 150.5,
      moneda: 1,
      notas: 'n',
      empresa: usuarioMock.empresa,
      turno: { id: 1 },
      estado: 1,
      id: 10,
    });
    expect(exito).toHaveBeenCalledWith('Registro actualizado correctamente !');
  });

  it('el alta sin moneda envía moneda: null', async () => {
    comp.abrir();
    comp.form.patchValue({ origen: lima, destino: callao, importe: 10 });
    await comp.guardar();
    expect(registrarTarifa).toHaveBeenCalledWith({
      origen: lima,
      destino: callao,
      importe: 10,
      moneda: null,
      notas: '',
      empresa: usuarioMock.empresa,
      turno: { id: 1 },
      estado: 0,
    });
  });

  it('la baja pide confirmación, elimina, avisa con alertMessage y recarga', async () => {
    confirmar.mockResolvedValue(true);
    await comp.alAccion({ accion: 'eliminar', fila: datos[0] });
    expect(confirmar).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: expect.stringContaining('PLANTA LIMA') }),
    );
    expect(eliminarTarifa).toHaveBeenCalledWith(datos[0]);
    expect(exito).toHaveBeenCalledWith('Tarifa eliminada');
    expect(listarTodasLasTarifasPorEmpresa).toHaveBeenCalledTimes(2);
  });

  it('si se cancela la confirmación no elimina', async () => {
    confirmar.mockResolvedValue(false);
    await comp.alAccion({ accion: 'eliminar', fila: datos[0] });
    expect(eliminarTarifa).not.toHaveBeenCalled();
  });

  it('muestra errorMessage del backend al guardar', async () => {
    registrarTarifa.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E', errorMessage: 'Tarifa duplicada' } })),
    );
    comp.abrir();
    comp.form.patchValue({ origen: lima, destino: callao, importe: 1 });
    await comp.guardar();
    expect(error).toHaveBeenCalledWith('Error', 'Tarifa duplicada');
    expect(comp.dialogoVisible()).toBe(true);
  });

  it('usa el mensaje genérico si falla la baja sin errorMessage', async () => {
    confirmar.mockResolvedValue(true);
    eliminarTarifa.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await comp.alAccion({ accion: 'eliminar', fila: datos[1] });
    expect(error).toHaveBeenCalledWith('Error', MENSAJE_ERROR_GENERICO);
  });
});
