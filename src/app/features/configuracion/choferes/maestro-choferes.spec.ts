import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import type { Chofer, Empresa, Vehiculo } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ChoferService, VehiculoService } from '../../../core/services';
import { ConfirmacionService } from '../../../shared/ui';
import { MaestroChoferes } from './maestro-choferes';

const vehiculo: Vehiculo = { id: 7, placaTracto: 'ABC-123', placaBombona: 'XYZ-987', modelo: 'Volvo', licencia: 'MTC7', estado: 0 };
const empresa = { id: 5, razonSocial: 'Mi Empresa' } as Empresa;
const lista: Chofer[] = [
  { id: 1, nombres: 'Juan', apellidos: 'Perez', dni: '12345678', licencia: 'Q123', certificado: 'MTC7', vehiculo, empresa },
];

describe('MaestroChoferes', () => {
  const servicio = { listarTodosLosChoferes: vi.fn(), registrarChofer: vi.fn(), actualizarChofer: vi.fn() };
  const vehiculos = { listarTodosLosVehiculosPorEmpresa: vi.fn() };
  const confirmar = vi.fn();
  const avisos = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };
  const sesion = { getUserLoggedIn: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        { provide: ChoferService, useValue: servicio },
        { provide: VehiculoService, useValue: vehiculos },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: avisos },
        { provide: SessionService, useValue: sesion },
      ],
    });
    const fixture = TestBed.createComponent(MaestroChoferes);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    servicio.listarTodosLosChoferes.mockReturnValue(of(lista));
    vehiculos.listarTodosLosVehiculosPorEmpresa.mockReturnValue(of([vehiculo]));
    sesion.getUserLoggedIn.mockReturnValue({ empresa });
  });

  it('carga el listado y el combo de vehículos', async () => {
    const fixture = crear();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(servicio.listarTodosLosChoferes).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.vehiculos()[0].etiqueta).toBe('ABC-123 / XYZ-987 / Volvo');
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Juan');
    expect(texto).toContain('ABC-123 / XYZ-987');
  });

  it('validaciones: DNI de 8 dígitos y teléfono numérico', () => {
    const c = crear().componentInstance;
    c.abrir();
    c.form.patchValue({ nombres: 'A', apellidos: 'B', vehiculo, certificado: 'C', licencia: 'L', dni: '123456789' });
    expect(c.form.controls.dni.errors).toHaveProperty('maxlength');
    c.form.patchValue({ dni: '1234abcd' });
    expect(c.form.controls.dni.errors).toHaveProperty('digits');
    c.form.patchValue({ dni: '12345678', telefono: '99x' });
    expect(c.form.controls.telefono.errors).toHaveProperty('digits');
    c.form.patchValue({ telefono: '' });
    expect(c.form.valid).toBe(true);
  });

  it('alta: envía el JSON de v1 con empresa id 1 sin mutar la sesión', async () => {
    servicio.registrarChofer.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    const c = crear().componentInstance;
    c.abrir();
    c.form.setValue({
      nombres: 'Ana',
      apellidos: 'Gil',
      dni: '87654321',
      telefono: '999',
      email: 'a@b.c',
      vehiculo: c.vehiculos()[0],
      certificado: '',
      licencia: 'L9',
    });
    c.seleccionarVehiculo(c.vehiculos()[0]);
    expect(c.form.controls.certificado.value).toBe('MTC7');
    await c.guardar();
    expect(servicio.registrarChofer).toHaveBeenCalledWith({
      nombres: 'Ana',
      apellidos: 'Gil',
      dni: '87654321',
      telefono: '999',
      email: 'a@b.c',
      vehiculo,
      licencia: 'L9',
      certificado: 'MTC7',
      empresa: { ...empresa, id: 1 },
    });
    expect(empresa.id).toBe(5);
    expect(avisos.exito).toHaveBeenCalledWith('Registro añadido correctamente !');
  });

  it('edición: precarga y envía id y empresa del registro', async () => {
    servicio.actualizarChofer.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    const c = crear().componentInstance;
    c.abrir(lista[0]);
    c.form.patchValue({ nombres: 'Juan Carlos' });
    await c.guardar();
    const enviado = servicio.actualizarChofer.mock.calls[0][0] as Chofer;
    expect(enviado.id).toBe(1);
    expect(enviado.nombres).toBe('Juan Carlos');
    expect(enviado.empresa).toEqual({ ...empresa, id: 1 });
    expect(avisos.exito).toHaveBeenCalledWith('Registro actualizado correctamente !');
  });

  it('baja: confirma y avisa que la opción está deshabilitada (como v1)', async () => {
    confirmar.mockResolvedValue(true);
    const c = crear().componentInstance;
    await c.alAccion({ accion: 'eliminar', fila: lista[0] });
    expect(avisos.info).toHaveBeenCalledWith('Opción deshabilitada !');
    confirmar.mockResolvedValue(false);
    avisos.info.mockClear();
    await c.alAccion({ accion: 'eliminar', fila: lista[0] });
    expect(avisos.info).not.toHaveBeenCalled();
  });

  it('error: muestra errorMessage del backend', async () => {
    servicio.registrarChofer.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E', errorMessage: 'DNI ya registrado' } })),
    );
    const c = crear().componentInstance;
    c.abrir();
    c.form.setValue({ nombres: 'A', apellidos: 'B', dni: '12345678', telefono: '', email: '', vehiculo, certificado: 'C', licencia: 'L' });
    await c.guardar();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'DNI ya registrado');
    expect(c.dialogoVisible()).toBe(true);
  });
});
