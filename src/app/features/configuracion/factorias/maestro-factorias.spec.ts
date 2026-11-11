import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Cliente, Factoria } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ClienteService, FactoriaService } from '../../../core/services';
import { ConfirmacionService } from '../../../shared/ui';
import { MaestroFactorias } from './maestro-factorias';

const cliente: Cliente = { id: 3, razonSocial: 'Gas SAC', ruc: '20123456789' };
const lista: Factoria[] = [
  {
    id: 10,
    codigo: 'P01',
    refLarga2: 'Gas SAC - Planta 1',
    nombre: 'Planta 1',
    direccion: 'Av. 1',
    distrito: 'Lima',
    provincia: 'Lima',
    departamento: 'Lima',
    estado: 0,
    cliente,
  },
];

describe('MaestroFactorias', () => {
  const servicio = {
    listarTodasLasFactorias: vi.fn(),
    registrarFactoria: vi.fn(),
    actualizarFactoria: vi.fn(),
    eliminarFactoria: vi.fn(),
  };
  const clientes = { listarClientesPorEmpresa: vi.fn() };
  const confirmar = vi.fn();
  const avisos = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        { provide: FactoriaService, useValue: servicio },
        { provide: ClienteService, useValue: clientes },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: avisos },
      ],
    });
    const fixture = TestBed.createComponent(MaestroFactorias);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    servicio.listarTodasLasFactorias.mockReturnValue(of(lista));
    clientes.listarClientesPorEmpresa.mockReturnValue(of([cliente]));
  });

  it('carga el listado y el combo de clientes', async () => {
    const fixture = crear();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(servicio.listarTodasLasFactorias).toHaveBeenCalledWith('O');
    expect(clientes.listarClientesPorEmpresa).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.clientes()[0].etiqueta).toBe('RUC 20123456789 - Gas SAC');
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Gas SAC - Planta 1');
    expect(texto).toContain('Activo');
  });

  it('alta: envía el JSON de v1 (sin etiqueta del combo)', async () => {
    servicio.registrarFactoria.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    const c = crear().componentInstance;
    c.abrir();
    expect(c.form.invalid).toBe(true);
    const opcion = c.clientes()[0];
    c.form.patchValue({ cliente: opcion, codigo: 'P02', nombre: 'Planta 2', direccion: 'Av. 2' });
    c.seleccionarCliente(opcion);
    expect(c.form.controls.ruc.value).toBe('20123456789');
    await c.guardar();
    expect(servicio.registrarFactoria).toHaveBeenCalledWith({
      cliente,
      codigo: 'P02',
      ruc: '20123456789',
      nombre: 'Planta 2',
      direccion: 'Av. 2',
      distrito: '',
      provincia: '',
      departamento: '',
      estado: 0,
      referencia: '?',
      tipo: 'O',
    });
    expect(avisos.exito).toHaveBeenCalledWith('Registro añadido correctamente !');
    expect(c.dialogoVisible()).toBe(false);
  });

  it('edición: precarga, envía el id y respeta el estado inactivo', async () => {
    servicio.actualizarFactoria.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    const c = crear().componentInstance;
    c.abrir(lista[0]);
    expect(c.form.controls.ruc.value).toBe('20123456789');
    c.form.patchValue({ estado: false });
    await c.guardar();
    expect(servicio.actualizarFactoria).toHaveBeenCalledWith({
      cliente,
      codigo: 'P01',
      ruc: '20123456789',
      nombre: 'Planta 1',
      direccion: 'Av. 1',
      distrito: 'Lima',
      provincia: 'Lima',
      departamento: 'Lima',
      estado: 1,
      referencia: '?',
      tipo: 'O',
      id: 10,
    });
    expect(avisos.exito).toHaveBeenCalledWith('Registro actualizado correctamente !');
  });

  it('edición: al volver a elegir cliente en el combo, el objeto enviado no lleva etiqueta', async () => {
    servicio.actualizarFactoria.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    const c = crear().componentInstance;
    c.abrir(lista[0]);
    const opcion = c.clientes()[0];
    c.form.patchValue({ cliente: opcion });
    c.seleccionarCliente(opcion);
    await c.guardar();
    const enviado = servicio.actualizarFactoria.mock.calls[0][0] as Factoria;
    expect(enviado.cliente).toEqual(cliente);
    expect(enviado.cliente).not.toHaveProperty('etiqueta');
  });

  it('muestra "Campo requerido" en un campo obligatorio tocado', () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.abrir();
    expect(c.invalido('codigo')).toBe(false);
    c.form.controls.codigo.markAsTouched();
    fixture.detectChanges();
    expect(c.invalido('codigo')).toBe(true);
    expect(c.error('codigo')).toBe('Campo requerido');
    expect(document.querySelector('#f-codigo-error')?.textContent).toContain('Campo requerido');
  });

  it('baja: confirma, elimina, avisa con alertMessage y recarga', async () => {
    confirmar.mockResolvedValue(true);
    servicio.eliminarFactoria.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Planta eliminada' }));
    const c = crear().componentInstance;
    await c.alAccion({ accion: 'eliminar', fila: lista[0] });
    expect(servicio.eliminarFactoria).toHaveBeenCalledWith(lista[0]);
    expect(avisos.info).toHaveBeenCalledWith('Planta eliminada');
    expect(servicio.listarTodasLasFactorias).toHaveBeenCalledTimes(2);
  });

  it('baja cancelada: no llama al servicio', async () => {
    confirmar.mockResolvedValue(false);
    const c = crear().componentInstance;
    await c.alAccion({ accion: 'eliminar', fila: lista[0] });
    expect(servicio.eliminarFactoria).not.toHaveBeenCalled();
  });

  it('error: muestra errorMessage del backend o el genérico', async () => {
    servicio.registrarFactoria.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E', errorMessage: 'Código duplicado' } })),
    );
    const c = crear().componentInstance;
    c.abrir();
    c.form.patchValue({ cliente, codigo: 'P', nombre: 'N', direccion: 'D', ruc: 'R' });
    await c.guardar();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'Código duplicado');
    expect(c.dialogoVisible()).toBe(true);

    servicio.registrarFactoria.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    await c.guardar();
    expect(avisos.error).toHaveBeenLastCalledWith('Error', 'Ocurrió un error inesperado!!, intenta nuevamente.');
  });
});
