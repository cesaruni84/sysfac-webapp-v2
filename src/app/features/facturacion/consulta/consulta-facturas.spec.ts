import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import { usuarioMock } from '../../../core/auth/auth.testing';
import type { Cliente, Documento } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ClienteService, ItemFacturaService } from '../../../core/services';
import { ExcelService } from '../../../core/services/export';
import { ConfirmacionService } from '../../../shared/ui';
import { MENSAJE_ERROR_GENERICO } from '../facturacion-comun';
import { ConsultaFacturas } from './consulta-facturas';

const clientes: Cliente[] = [{ id: 7, ruc: '20123456789', razonSocial: 'ACME SAC' }];

const docs: Documento[] = [
  {
    id: 10,
    tipoDocumento: 1,
    serie: 'F001',
    secuencia: '00000012',
    estado: 1,
    notas: '1',
    observacion: 'Venta de aceite',
    totalDocumento: 1234.5,
    fechaEmision: '2021-03-15',
    cliente: { id: 7, razonSocial: 'ACME SAC' },
    moneda: { id: 1, nemonico: 'S/' },
  },
  {
    id: 11,
    tipoDocumento: 4,
    serie: 'B001',
    secuencia: '00000003',
    estado: 3,
    notas: '2',
    observacion: 'Anulada por error',
    totalDocumento: 50,
    fechaEmision: '2021-03-16',
    cliente: { id: 8, razonSocial: 'BETA SAC' },
    moneda: { id: 2, nemonico: '$' },
  },
];

describe('ConsultaFacturas', () => {
  let fixture: ComponentFixture<ConsultaFacturas>;
  let comp: ConsultaFacturas;
  const listarClientesPorEmpresa = vi.fn();
  const listarDocumentosPorFiltro = vi.fn();
  const cancelarDocumentoElectronico = vi.fn();
  const generarReporteFacturacion = vi.fn();
  const confirmar = vi.fn();
  const error = vi.fn();
  const exito = vi.fn();
  const navigate = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    localStorage.clear();
    listarClientesPorEmpresa.mockReturnValue(of(clientes));
    listarDocumentosPorFiltro.mockReturnValue(of(docs));
    cancelarDocumentoElectronico.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Cancelado ok' }));
    generarReporteFacturacion.mockResolvedValue(undefined);
    navigate.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: ClienteService, useValue: { listarClientesPorEmpresa } },
        { provide: ItemFacturaService, useValue: { listarDocumentosPorFiltro, cancelarDocumentoElectronico } },
        { provide: ExcelService, useValue: { generarReporteFacturacion } },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: { error, exito } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    TestBed.inject(SessionService).setUserLoggedIn(usuarioMock);
    fixture = TestBed.createComponent(ConsultaFacturas);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('carga los clientes de la empresa y los filtros con sus valores por defecto', () => {
    expect(listarClientesPorEmpresa).toHaveBeenCalledWith(2);
    expect(comp.opcionesCliente()).toEqual([
      { valor: 0, texto: 'Todos' },
      { valor: 7, texto: 'RUC 20123456789 - ACME SAC' },
    ]);
    const hoy = new Date();
    const v = comp.form.getRawValue();
    expect(v.tipoDocumento).toBe(0);
    expect(v.estado).toBe(0);
    expect(v.cliente).toBe(0);
    expect(v.serie).toBe('');
    expect(v.secuencial).toBe('');
    expect(v.fechaIni).toEqual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    expect((v.fechaFin as Date).toDateString()).toBe(hoy.toDateString());
    expect(listarDocumentosPorFiltro).not.toHaveBeenCalled();
  });

  it('busca con los parámetros exactos de v1 (fechas yyyy-MM-dd)', async () => {
    comp.form.patchValue({
      tipoDocumento: 4,
      serie: 'F001',
      secuencial: '12',
      fechaIni: new Date(2021, 2, 1),
      fechaFin: new Date(2021, 2, 31),
      estado: 2,
      cliente: 7,
    });
    await comp.buscar();
    expect(listarDocumentosPorFiltro).toHaveBeenCalledWith(2, 'F001', '12', 4, 7, 2, '2021-03-01', '2021-03-31');
    expect(comp.documentos()).toEqual(docs);
  });

  it('con los filtros por defecto envía serie y correlativo vacíos y 0 en los combos', async () => {
    await comp.buscar();
    const hoy = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    expect(listarDocumentosPorFiltro).toHaveBeenCalledWith(
      2,
      '',
      '',
      0,
      0,
      0,
      `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-01`,
      `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`,
    );
  });

  it('no busca si falta una fecha y marca el error', async () => {
    comp.form.controls.fechaIni.setValue(null);
    await comp.buscar();
    expect(listarDocumentosPorFiltro).not.toHaveBeenCalled();
    expect(comp.invalido('fechaIni')).toBe(true);
  });

  it('muestra las glosas de tipo, estado y glosa, y el importe con su moneda', async () => {
    await comp.buscar();
    fixture.detectChanges();
    const filas = comp.filas();
    expect(filas[0]).toMatchObject({ tipoDocGlosa: 'Factura', estadoGlosa: 'Registrado', glosa: 'Venta de aceite' });
    expect(filas[1]).toMatchObject({
      tipoDocGlosa: 'Boleta de Venta',
      estadoGlosa: 'Anulado',
      glosa: 'Anulada por error / TRANSPORTE',
    });
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('S/ 1,234.50');
    expect(texto).toContain('$ 50.00');
    expect(texto).toContain('15/03/2021');
    expect(texto).toContain('ACME SAC');
    expect(texto).toContain('Registrado');
  });

  it('muestra errorMessage del backend si la búsqueda falla', async () => {
    listarDocumentosPorFiltro.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E1', errorMessage: 'Rango inválido' } })),
    );
    await comp.buscar();
    expect(error).toHaveBeenCalledWith('Error', 'Rango inválido');
    expect(comp.documentos()).toEqual([]);
  });

  it('usa el mensaje genérico de v1 si no llega errorMessage', async () => {
    listarDocumentosPorFiltro.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    await comp.buscar();
    expect(error).toHaveBeenCalledWith('Error', MENSAJE_ERROR_GENERICO);
    expect(MENSAJE_ERROR_GENERICO).toBe('Error de comunicación con los servicios. Intenta nuevamente.');
  });

  it('cancelar aceptado: envía el JSON de v1 y cambia el estado en la grilla', async () => {
    await comp.buscar();
    confirmar.mockResolvedValue(true);
    await comp.cancelar(docs[0]);
    expect(confirmar).toHaveBeenCalledWith({ mensaje: 'Confirma cancelar el documento F001 - 00000012 ?' });
    expect(cancelarDocumentoElectronico).toHaveBeenCalledWith(
      {
        id: 10,
        serie: 'F001',
        secuencia: '00000012',
        observacionSunat: 'Cancelado con Fecha ' + new Date().toLocaleDateString(),
        estado: 2,
      },
      2,
    );
    expect(comp.documentos()[0].estado).toBe(2);
    expect(comp.documentos()[1].estado).toBe(3);
    expect(comp.filas()[0].estadoGlosa).toBe('Cancelado');
    expect(exito).toHaveBeenCalledWith('Cancelado ok');
  });

  it('cancelar rechazado: no llama al backend ni cambia la grilla', async () => {
    await comp.buscar();
    confirmar.mockResolvedValue(false);
    await comp.cancelar(docs[0]);
    expect(cancelarDocumentoElectronico).not.toHaveBeenCalled();
    expect(comp.documentos()[0].estado).toBe(1);
  });

  it('cancelar con error del backend muestra errorMessage y deja el estado', async () => {
    await comp.buscar();
    confirmar.mockResolvedValue(true);
    cancelarDocumentoElectronico.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { codeMessage: 'E2', errorMessage: 'No se puede cancelar' } })),
    );
    await comp.cancelar(docs[0]);
    expect(error).toHaveBeenCalledWith('Error', 'No se puede cancelar');
    expect(comp.documentos()[0].estado).toBe(1);
  });

  it('exporta todos los documentos de la consulta', async () => {
    await comp.buscar();
    await comp.exportar();
    expect(generarReporteFacturacion).toHaveBeenCalledWith(docs);
  });

  it('consultar navega al registro con los parámetros de v1', () => {
    comp.alAccion({ accion: 'consultar', fila: comp.filas()[0] ?? { ...docs[0], tipoDocGlosa: '', estadoGlosa: '', glosa: '' } });
    expect(navigate).toHaveBeenCalledWith(['/forms/facturacion/registro'], {
      queryParams: { tipoDoc: 1, serie: 'F001', secuencia: '00000012' },
    });
  });

  it('filtra el correlativo a dígitos (máx. 8) y la serie a 5 caracteres', () => {
    const input = document.createElement('input');
    input.value = 'a1b2c3d4e5f6g7h8i9';
    comp.filtrarSecuencial({ target: input } as unknown as Event);
    expect(comp.form.controls.secuencial.value).toBe('12345678');
    input.value = 'ABCDEFG';
    comp.filtrarSerie({ target: input } as unknown as Event);
    expect(comp.form.controls.serie.value).toBe('ABCDE');
  });

  it('los combos se localizan por su id (el paginador también es un combobox)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#tipoDocumento')).not.toBeNull();
    expect(el.querySelector('#estado')).not.toBeNull();
    expect(el.querySelector('#cliente')).not.toBeNull();
  });
});
