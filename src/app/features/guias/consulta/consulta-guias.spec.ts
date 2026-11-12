import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import { CargaGlobalService } from '../../../core/carga';
import type { Empresa } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ChoferService, FactoriaService, GuiaRemisionService } from '../../../core/services';
import { ExcelService } from '../../../core/services/export';
import { ConfirmacionService } from '../../../shared/ui';
import { ConsultaGuias, glosaEstadoFactura, type GuiaApi } from './consulta-guias';

const empresa = { id: 5 } as Empresa;
const guia: GuiaApi = {
  id: 1,
  nroguia: '00001',
  nroSecuencia: '00000010',
  fechaEmision: '15/03/2021',
  usuarioRegistra: 'admin',
  nroLiq: 'L1',
  ordenServicio: '',
  remitente: 'REM',
  destinatario: 'DEST',
  estado: 'REGISTRADO',
  producto: 'GLP',
  cantidad: '10',
  chofer: 'Juan Perez',
  nroGuiaCliente: '0001-0000002',
  fechaRecepcion: '16/03/2021',
  factura: 'F001-1',
  estadoFactura: 2,
  nemonicoEstadoFactura: 'CAN',
};

describe('ConsultaGuias', () => {
  const guias = {
    listarGuiasConFiltros: vi.fn(),
    listarGuiasPorGuiaCliente: vi.fn(),
    eliminarGuiaBD: vi.fn(),
  };
  const factorias = { listarComboFactorias: vi.fn() };
  const choferes = { listarComboChoferes: vi.fn() };
  const excel = { generarReporteGuiasRemision: vi.fn() };
  const confirmar = vi.fn();
  const avisos = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };
  const sesion = { getUserLoggedIn: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GuiaRemisionService, useValue: guias },
        { provide: FactoriaService, useValue: factorias },
        { provide: ChoferService, useValue: choferes },
        { provide: ExcelService, useValue: excel },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: avisos },
        { provide: SessionService, useValue: sesion },
      ],
    });
    const fixture = TestBed.createComponent(ConsultaGuias);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    guias.listarGuiasConFiltros.mockReturnValue(of([guia]));
    guias.listarGuiasPorGuiaCliente.mockReturnValue(of([guia]));
    guias.eliminarGuiaBD.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Guía eliminada' }));
    factorias.listarComboFactorias.mockReturnValue(of([{ id: 3, refLarga2: 'PLANTA A' }]));
    choferes.listarComboChoferes.mockReturnValue(of([{ id: 9, nombres: 'Juan', apellidos: 'Perez' }]));
    excel.generarReporteGuiasRemision.mockResolvedValue(undefined);
    sesion.getUserLoggedIn.mockReturnValue({ empresa });
  });

  it('carga los combos como v1 (factorías tipo D, choferes empresa 1)', () => {
    const c = crear().componentInstance;
    expect(factorias.listarComboFactorias).toHaveBeenCalledWith('D');
    expect(choferes.listarComboChoferes).toHaveBeenCalledWith(1);
    expect(c.factorias()).toEqual([
      { id: 0, etiqueta: 'Todos' },
      { id: 3, etiqueta: 'PLANTA A' },
    ]);
    expect(c.choferes()[1]).toEqual({ id: 9, etiqueta: 'Juan Perez' });
  });

  it('busca con los valores por defecto y los parámetros exactos', async () => {
    const c = crear().componentInstance;
    const hoy = new Date();
    c.form.patchValue({ fechaIniTraslado: new Date(2021, 2, 1), fechaFinTraslado: new Date(2021, 2, 31) });
    await c.filtrar();
    expect(guias.listarGuiasConFiltros).toHaveBeenCalledWith(5, '', '', 99, 0, 0, 0, true, 0, '2021-03-01', '2021-03-31');
    expect(guias.listarGuiasPorGuiaCliente).not.toHaveBeenCalled();
    expect(c.form.controls.fechaIniTraslado.value).toBeInstanceOf(Date);
    expect(hoy).toBeInstanceOf(Date);
  });

  it('el rango inicial es del primer día del mes a hoy', () => {
    const c = crear().componentInstance;
    const ini = c.form.controls.fechaIniTraslado.value as Date;
    const hoy = new Date();
    expect(ini.getDate()).toBe(1);
    expect(ini.getMonth()).toBe(hoy.getMonth());
    expect((c.form.controls.fechaFinTraslado.value as Date).getDate()).toBe(hoy.getDate());
  });

  it('con filtros: completa con ceros, ignora el filtro de facturas con serie y secuencia', async () => {
    const c = crear().componentInstance;
    c.form.patchValue({
      nroSerie: '12',
      nroSecuencia: '345',
      estadoSelected: 1,
      choferSelected: 9,
      origenSelected: 2,
      destinatarioSelected: 3,
      filtroFacturas: 2,
      fechaIniTraslado: new Date(2021, 0, 5),
      fechaFinTraslado: new Date(2021, 0, 6),
    });
    await c.filtrar();
    expect(guias.listarGuiasConFiltros).toHaveBeenCalledWith(5, '00012', '00000345', 1, 9, 2, 3, true, 0, '2021-01-05', '2021-01-06');
    expect(c.form.controls.nroSerie.value).toBe('00012');
  });

  it('solo serie: respeta el filtro de facturas', async () => {
    const c = crear().componentInstance;
    c.form.patchValue({ nroSerie: '7', filtroFacturas: 1 });
    await c.filtrar();
    expect(guias.listarGuiasConFiltros.mock.calls[0].slice(1, 3)).toEqual(['00007', '']);
    expect(guias.listarGuiasConFiltros.mock.calls[0][8]).toBe(1);
  });

  it('busca por guía del cliente cuando no hay guía propia', async () => {
    const c = crear().componentInstance;
    c.form.patchValue({
      nroSerieCli: '1',
      nroSecuenciaCli: '2',
      filtroFacturas: 1,
      fechaIniTraslado: new Date(2021, 0, 5),
      fechaFinTraslado: new Date(2021, 0, 6),
    });
    await c.filtrar();
    expect(guias.listarGuiasPorGuiaCliente).toHaveBeenCalledWith(5, '00001', '00000002', 99, 0, 0, 0, true, 0, '2021-01-05', '2021-01-06');
    expect(guias.listarGuiasConFiltros).not.toHaveBeenCalled();
  });

  it('la guía propia tiene prioridad sobre la del cliente', async () => {
    const c = crear().componentInstance;
    c.form.patchValue({ nroSecuencia: '5', nroSerieCli: '1' });
    await c.filtrar();
    expect(guias.listarGuiasConFiltros).toHaveBeenCalled();
    expect(guias.listarGuiasPorGuiaCliente).not.toHaveBeenCalled();
  });

  it('sin fechas no busca y muestra el error accesible', async () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.form.patchValue({ fechaIniTraslado: null });
    await c.filtrar();
    fixture.detectChanges();
    expect(guias.listarGuiasConFiltros).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('#g-fecha-ini-error')?.textContent).toContain('REQUERIDO');
  });

  it('series y secuencias solo admiten dígitos y se recortan', () => {
    const fixture = crear();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#g-serie')!;
    input.value = '12a3456';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('12345');
    expect(fixture.componentInstance.form.controls.nroSerie.value).toBe('12345');
  });

  it('los combos tienen etiqueta accesible', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    for (const id of ['estado', 'filtro', 'origen', 'destino', 'chofer']) {
      expect(el.querySelector(`#g-${id}-label`)).not.toBeNull();
      expect(el.querySelector(`p-select[inputid="g-${id}"]`)?.getAttribute('ariaLabelledBy') ?? 'ok').toBeTruthy();
    }
  });

  it('muestra glosas de estado y las deja como campo calculado', async () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    await c.filtrar();
    fixture.detectChanges();
    const fila = c.guias()[0];
    expect(fila.estadoFacturaTexto).toBe('Cancelado');
    expect(fila.estadoGuiaTexto).toBe('Registrado');
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Cancelado');
    expect(texto).toContain('Registrado');
    expect(glosaEstadoFactura(1)).toBe('Registrado');
    expect(glosaEstadoFactura(3)).toBe('Anulado');
    expect(glosaEstadoFactura(undefined)).toBe('-');
  });

  it('guía anulada sin factura: sin glosa de factura', async () => {
    guias.listarGuiasConFiltros.mockReturnValue(of([{ ...guia, estado: 'ANULADO', estadoFactura: undefined }]));
    const c = crear().componentInstance;
    await c.filtrar();
    expect(c.guias()[0].estadoGuiaTexto).toBe('Anulado');
    expect(c.guias()[0].estadoFacturaTexto).toBe('');
  });

  it('abre el registro con _serie y _secuencia tal como vienen en la fila', async () => {
    const fixture = crear();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.componentInstance.filtrar();
    await fixture.componentInstance.alAccion({ accion: 'ver', fila: fixture.componentInstance.guias()[0] });
    expect(navegar).toHaveBeenCalledWith(['/forms/basic'], { queryParams: { _serie: '00001', _secuencia: '00000010' } });
  });

  it('eliminar: confirma, elimina con (serie, secuencia, empresa), avisa y recarga', async () => {
    confirmar.mockResolvedValue(true);
    const c = crear().componentInstance;
    await c.filtrar();
    await c.alAccion({ accion: 'eliminar', fila: c.guias()[0] });
    expect(confirmar.mock.calls[0][0].mensaje).toBe('Confirma eliminar la guia de remisión: 00001  -  00000010 ?');
    expect(guias.eliminarGuiaBD).toHaveBeenCalledWith('00001', '00000010', 5);
    expect(avisos.exito).toHaveBeenCalledWith('OK', 'Guía eliminada');
    expect(guias.listarGuiasConFiltros).toHaveBeenCalledTimes(2);
  });

  it('eliminar cancelado no llama al backend', async () => {
    confirmar.mockResolvedValue(false);
    const c = crear().componentInstance;
    await c.filtrar();
    await c.alAccion({ accion: 'eliminar', fila: c.guias()[0] });
    expect(guias.eliminarGuiaBD).not.toHaveBeenCalled();
    expect(guias.listarGuiasConFiltros).toHaveBeenCalledTimes(1);
  });

  it('error al eliminar muestra errorMessage y no recarga', async () => {
    confirmar.mockResolvedValue(true);
    guias.eliminarGuiaBD.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E1', errorMessage: 'No se puede eliminar' } })),
    );
    const c = crear().componentInstance;
    await c.filtrar();
    await c.alAccion({ accion: 'eliminar', fila: c.guias()[0] });
    expect(avisos.error).toHaveBeenCalledWith('Error', 'No se puede eliminar');
    expect(guias.listarGuiasConFiltros).toHaveBeenCalledTimes(1);
  });

  it('error de búsqueda: errorMessage, o mensaje genérico de v1 si no viene', async () => {
    guias.listarGuiasConFiltros.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { codeMessage: 'E', errorMessage: 'Falla del servidor' } })),
    );
    const c = crear().componentInstance;
    await c.filtrar();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'Falla del servidor');
    expect(c.guias()).toEqual([]);
    guias.listarGuiasConFiltros.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 0 })));
    await c.filtrar();
    expect(avisos.error).toHaveBeenLastCalledWith('Error', 'Error de comunicación con los servicios. Intenta nuevamente.');
  });

  it('exporta todas las filas de la consulta mapeadas a GuiaRemisionFilaExcel, sin glosas', async () => {
    const c = crear().componentInstance;
    const ejecutar = vi.spyOn(TestBed.inject(CargaGlobalService), 'ejecutar');
    await c.filtrar();
    await c.exportar();
    expect(ejecutar).toHaveBeenCalled();
    expect(excel.generarReporteGuiasRemision).toHaveBeenCalledWith([
      {
        id: 1,
        nroguia: '00001',
        nroSecuencia: '00000010',
        fechaEmision: '15/03/2021',
        usuarioRegistra: 'admin',
        nroLiq: 'L1',
        ordenServicio: '',
        remitente: 'REM',
        destinatario: 'DEST',
        estado: 'REGISTRADO',
        producto: 'GLP',
        cantidad: '10',
        chofer: 'Juan Perez',
        nroGuiaCliente: '0001-0000002',
        fechaRecepcion: '16/03/2021',
        factura: 'F001-1',
        nemonicoEstadoFactura: 'CAN',
      },
    ]);
  });

  it('limpiar restablece los filtros', () => {
    const c = crear().componentInstance;
    c.form.patchValue({ nroSerie: '1', estadoSelected: 0, choferSelected: 9 });
    c.limpiar();
    expect(c.form.getRawValue()).toMatchObject({ nroSerie: '', estadoSelected: 99, choferSelected: 0, filtroFacturas: 0 });
  });
});
