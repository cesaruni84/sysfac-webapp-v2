import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Vehiculo } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { VehiculoService } from '../../../core/services';
import { ConfirmacionService } from '../../../shared/ui';
import { MaestroVehiculos } from './maestro-vehiculos';

const lista: Vehiculo[] = [
  { id: 1, placaTracto: 'ABC-123', placaBombona: 'XYZ-987', modelo: 'Volvo', licencia: 'MTC1', estado: 0, fechaRegistro: '2021-03-15' },
];

describe('MaestroVehiculos', () => {
  const servicio = {
    listarTodosLosVehiculosPorEmpresa: vi.fn(),
    registrarVehiculo: vi.fn(),
    actualizarVehiculo: vi.fn(),
  };
  const confirmar = vi.fn();
  const avisos = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        { provide: VehiculoService, useValue: servicio },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: avisos },
      ],
    });
    const fixture = TestBed.createComponent(MaestroVehiculos);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    servicio.listarTodosLosVehiculosPorEmpresa.mockReturnValue(of(lista));
  });

  it('carga y pinta el listado', async () => {
    const fixture = crear();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(servicio.listarTodosLosVehiculosPorEmpresa).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.vehiculos()).toEqual(lista);
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('ABC-123');
    expect(texto).toContain('Operativo');
  });

  it('alta: envía el JSON de v1', async () => {
    servicio.registrarVehiculo.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    const c = crear().componentInstance;
    c.abrir();
    expect(c.form.invalid).toBe(true);
    c.form.setValue({ tracto: 'T1', bombona: 'B1', marca: 'Scania', certificado: 'C1', estado: false });
    await c.guardar();
    expect(servicio.registrarVehiculo).toHaveBeenCalledWith({
      placaTracto: 'T1',
      placaBombona: 'B1',
      modelo: 'Scania',
      licencia: 'C1',
      garantia: 'S',
      estado: 1,
    });
    expect(avisos.exito).toHaveBeenCalledWith('Registro añadido correctamente !');
    expect(c.dialogoVisible()).toBe(false);
  });

  it('edición: precarga, envía el id y avisa', async () => {
    servicio.actualizarVehiculo.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    const c = crear().componentInstance;
    c.abrir(lista[0]);
    expect(c.form.getRawValue()).toEqual({ tracto: 'ABC-123', bombona: 'XYZ-987', marca: 'Volvo', certificado: 'MTC1', estado: true });
    await c.guardar();
    expect(servicio.actualizarVehiculo).toHaveBeenCalledWith({
      id: 1,
      placaTracto: 'ABC-123',
      placaBombona: 'XYZ-987',
      modelo: 'Volvo',
      licencia: 'MTC1',
      garantia: 'S',
      estado: 0,
    });
    expect(avisos.exito).toHaveBeenCalledWith('Registro actualizado correctamente !');
  });

  it('baja: confirma y avisa que la opción está deshabilitada (como v1)', async () => {
    confirmar.mockResolvedValue(true);
    const c = crear().componentInstance;
    await c.alAccion({ accion: 'eliminar', fila: lista[0] });
    expect(avisos.info).toHaveBeenCalledWith('Opción deshabilitada !');
  });

  it('error: muestra errorMessage del backend o el genérico', async () => {
    servicio.registrarVehiculo.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E1', errorMessage: 'Placa duplicada' } })),
    );
    const c = crear().componentInstance;
    c.abrir();
    c.form.setValue({ tracto: 'T1', bombona: 'B1', marca: 'M', certificado: 'C', estado: true });
    await c.guardar();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'Placa duplicada');
    expect(c.dialogoVisible()).toBe(true);

    servicio.registrarVehiculo.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500, error: null })));
    await c.guardar();
    expect(avisos.error).toHaveBeenLastCalledWith('Error', 'Ocurrió un error inesperado!!, intenta nuevamente.');
  });
});
