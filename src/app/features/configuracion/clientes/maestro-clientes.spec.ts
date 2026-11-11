import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import { usuarioMock } from '../../../core/auth/auth.testing';
import type { Cliente } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ClienteService } from '../../../core/services';
import { MaestroClientes, MENSAJE_ERROR_GENERICO } from './maestro-clientes';

const datos: Cliente[] = [
  {
    id: 3,
    tipoDoc: 1,
    ruc: '20123456789',
    razonSocial: 'ACME SAC',
    direccion: 'Av. 1',
    telefono: '999',
    email: 'a@acme.pe',
    distrito: 'Lima',
    provincia: 'Lima',
    departamento: 'Lima',
  },
  { id: 4, tipoDoc: 2, ruc: '12345678', razonSocial: 'Juan Perez' },
];

describe('MaestroClientes', () => {
  let fixture: ComponentFixture<MaestroClientes>;
  let comp: MaestroClientes;
  const listarClientesPorEmpresa = vi.fn();
  const registrarCliente = vi.fn();
  const actualizarCliente = vi.fn();
  const error = vi.fn();
  const exito = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    localStorage.clear();
    listarClientesPorEmpresa.mockReturnValue(of(datos));
    registrarCliente.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    actualizarCliente.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ClienteService, useValue: { listarClientesPorEmpresa, registrarCliente, actualizarCliente } },
        { provide: NotificacionService, useValue: { error, exito } },
      ],
    });
    TestBed.inject(SessionService).setUserLoggedIn(usuarioMock);
    fixture = TestBed.createComponent(MaestroClientes);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('lista los clientes de la empresa de la sesión', () => {
    expect(listarClientesPorEmpresa).toHaveBeenCalledWith(2);
    expect(comp.clientes()).toEqual(datos);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('ACME SAC');
    expect(texto).toContain('RUC');
    expect(texto).toContain('DNI');
  });

  it('el combo de tipo de documento sale del catálogo fijo', () => {
    expect(comp.tiposDocumento.map((t) => t.descripcion)).toEqual(['RUC', 'DNI', 'OTRO']);
    expect(comp.glosaTipoDoc(3)).toBe('OTRO');
    expect(comp.glosaTipoDoc(undefined)).toBe('');
  });

  it('el alta envía el JSON de v1 (nombreComercial fijo "?")', async () => {
    comp.abrir();
    expect(comp.form.getRawValue().tipoDocumento).toBe(1);
    comp.form.patchValue({ ruc: '20999999999', nombre: 'Nueva SAC', email: 'x@y.pe' });
    await comp.guardar();
    expect(registrarCliente).toHaveBeenCalledWith({
      tipoDoc: 1,
      ruc: '20999999999',
      razonSocial: 'Nueva SAC',
      nombreComercial: '?',
      telefono: '',
      email: 'x@y.pe',
      direccion: '',
      distrito: '',
      provincia: '',
      departamento: '',
    });
    expect(exito).toHaveBeenCalledWith('Registro añadido correctamente !');
    expect(comp.dialogoVisible()).toBe(false);
    expect(listarClientesPorEmpresa).toHaveBeenCalledTimes(2);
  });

  it('la edición precarga los datos (incluido el tipo de documento) y envía el id', async () => {
    comp.alAccion({ accion: 'editar', fila: comp.filas()[1] });
    expect(comp.form.getRawValue()).toMatchObject({ tipoDocumento: 2, ruc: '12345678', nombre: 'Juan Perez' });
    comp.form.patchValue({ telefono: '555' });
    await comp.guardar();
    expect(actualizarCliente).toHaveBeenCalledWith({
      tipoDoc: 2,
      ruc: '12345678',
      razonSocial: 'Juan Perez',
      nombreComercial: '?',
      telefono: '555',
      email: '',
      direccion: '',
      distrito: '',
      provincia: '',
      departamento: '',
      id: 4,
    });
    expect(exito).toHaveBeenCalledWith('Registro actualizado correctamente !');
  });

  it('un campo obligatorio tocado y vacío queda con aria-invalid y muestra el mensaje', async () => {
    comp.abrir();
    comp.form.controls.ruc.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const ruc = document.querySelector('[data-testid="ruc"]') as HTMLElement;
    expect(ruc.getAttribute('aria-invalid')).toBe('true');
    expect(ruc.getAttribute('aria-describedby')).toBe('ruc-error');
    expect(document.getElementById('ruc-error')?.textContent).toContain('REQUERIDO');
  });

  it('limpia el documento al pegar (solo dígitos, máximo 12)', async () => {
    comp.abrir();
    fixture.detectChanges();
    await fixture.whenStable();
    const ruc = document.querySelector('[data-testid="ruc"]') as HTMLInputElement;
    ruc.value = '20-123.456-789';
    ruc.dispatchEvent(new Event('input'));
    expect(ruc.value).toBe('20123456789');
    expect(comp.form.controls.ruc.value).toBe('20123456789');
    ruc.value = '1234567890123456';
    ruc.dispatchEvent(new Event('input'));
    expect(comp.form.controls.ruc.value).toBe('123456789012');
  });

  it('el combo de tipo de documento tiene nombre accesible por aria-labelledby', async () => {
    comp.abrir();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const combo = document.querySelector('.p-dialog [role="combobox"]');
    expect(combo?.getAttribute('aria-labelledby')).toBe('tipoDocumento-label');
  });

  it('valida requeridos y formato de correo', async () => {
    comp.abrir();
    expect(comp.form.invalid).toBe(true);
    comp.form.patchValue({ ruc: '1', nombre: 'N', email: 'no-es-correo' });
    expect(comp.form.controls.email.hasError('email')).toBe(true);
    await comp.guardar();
    expect(registrarCliente).not.toHaveBeenCalled();
    comp.form.patchValue({ email: '' });
    expect(comp.form.valid).toBe(true);
  });

  it('muestra errorMessage del backend', async () => {
    registrarCliente.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E', errorMessage: 'RUC ya registrado' } })),
    );
    comp.abrir();
    comp.form.patchValue({ ruc: '1', nombre: 'N' });
    await comp.guardar();
    expect(error).toHaveBeenCalledWith('Error', 'RUC ya registrado');
    expect(comp.dialogoVisible()).toBe(true);
  });

  it('usa el mensaje genérico ante un error sin errorMessage', async () => {
    listarClientesPorEmpresa.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await comp.listar();
    expect(error).toHaveBeenCalledWith('Error', MENSAJE_ERROR_GENERICO);
  });
});
