import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import type { Empresa, Liquidacion } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { FactoriaService, LiquidacionService } from '../../../core/services';
import { ExcelService } from '../../../core/services/export';
import { ConfirmacionService } from '../../../shared/ui';
import { ConsultaLiquidaciones, formatoFechaFiltro, glosaEstadoLiquidacion } from './consulta-liquidaciones';

const empresa = { id: 5 } as Empresa;
const lista: Liquidacion[] = [
  {
    id: 1,
    nrodoc: '000000000001',
    fechaEmision: '2021-03-15T00:00:00',
    estado: 1,
    importeTotal: 1234.5,
    origen: { id: 1, refLarga1: 'PLANTA A' },
    destino: { id: 2, refLarga1: 'PLANTA B' },
    documento: { serie: 'F001', secuencia: '00000010' } as Liquidacion['documento'],
  },
  { id: 2, nrodoc: '000000000002', estado: 2, importeTotal: 10, origen: { id: 1 }, destino: { id: 2 } },
];

describe('ConsultaLiquidaciones', () => {
  const liquidaciones = { listarLiquidacionesPorFiltro: vi.fn(), eliminarLiquidacionBD: vi.fn() };
  const factorias = { listarComboFactorias: vi.fn() };
  const excel = { generarReporteLiquidaciones: vi.fn() };
  const confirmar = vi.fn();
  const avisos = { exito: vi.fn(), error: vi.fn(), info: vi.fn() };
  const sesion = { getUserLoggedIn: vi.fn() };

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LiquidacionService, useValue: liquidaciones },
        { provide: FactoriaService, useValue: factorias },
        { provide: ExcelService, useValue: excel },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: avisos },
        { provide: SessionService, useValue: sesion },
      ],
    });
    const fixture = TestBed.createComponent(ConsultaLiquidaciones);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    liquidaciones.listarLiquidacionesPorFiltro.mockReturnValue(of(lista));
    factorias.listarComboFactorias.mockReturnValue(of([{ id: 3, refLarga2: 'Planta C' }]));
    excel.generarReporteLiquidaciones.mockResolvedValue(undefined);
    sesion.getUserLoggedIn.mockReturnValue({ empresa });
  });

  it('formatea fechas como yyyy-MM-dd local y las glosas de estado', () => {
    expect(formatoFechaFiltro(new Date(2021, 0, 5, 23, 59))).toBe('2021-01-05');
    expect(glosaEstadoLiquidacion(1)).toBe('Vigente');
    expect(glosaEstadoLiquidacion(2)).toBe('Vencido');
    expect(glosaEstadoLiquidacion(undefined)).toBe('Vencido');
  });

  it('carga los combos de origen y destino con "Todos"', () => {
    const c = crear().componentInstance;
    expect(factorias.listarComboFactorias).toHaveBeenCalledWith('O');
    expect(factorias.listarComboFactorias).toHaveBeenCalledWith('D');
    expect(c.origenes()).toEqual([
      { id: 0, refLarga2: 'Todos' },
      { id: 3, refLarga2: 'Planta C' },
    ]);
  });

  it('valores por defecto: del primer día del mes a hoy, todo en 0', () => {
    const c = crear().componentInstance;
    const v = c.filtros.getRawValue();
    const hoy = new Date();
    expect(v.fechaIni).toEqual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    expect(formatoFechaFiltro(v.fechaFin as Date)).toBe(formatoFechaFiltro(hoy));
    expect([v.origen, v.destino, v.estado, v.tipoBusqueda, v.nroDocLiq]).toEqual([0, 0, 0, 0, '']);
  });

  it('busca enviando los parámetros exactos al servicio', async () => {
    const c = crear().componentInstance;
    c.filtros.setValue({
      nroDocLiq: '',
      fechaIni: new Date(2021, 2, 1),
      fechaFin: new Date(2021, 2, 31),
      origen: 3,
      destino: 4,
      estado: 1,
      tipoBusqueda: 2,
    });
    await c.buscar();
    expect(liquidaciones.listarLiquidacionesPorFiltro).toHaveBeenCalledWith(5, '', 3, 4, 1, 2, '2021-03-01', '2021-03-31');
    expect(c.filas()).toHaveLength(2);
    expect(c.filas()[0].facturaTexto).toBe('F001-00000010');
    expect(c.filas()[0].estadoTexto).toBe('Vigente');
    expect(c.filas()[1].facturaTexto).toBe('-');
    expect(c.filas()[1].estadoTexto).toBe('Vencido');
  });

  it('con número de liquidación ignora el filtro de facturación (tipoBusqueda 0)', async () => {
    const c = crear().componentInstance;
    c.filtros.patchValue({ nroDocLiq: '000000000007', tipoBusqueda: 1, fechaIni: new Date(2021, 0, 1), fechaFin: new Date(2021, 0, 2) });
    await c.buscar();
    expect(liquidaciones.listarLiquidacionesPorFiltro).toHaveBeenCalledWith(5, '000000000007', 0, 0, 0, 0, '2021-01-01', '2021-01-02');
  });

  it('el número solo admite dígitos y se completa con ceros a 12', () => {
    const fixture = crear();
    const input = document.querySelector('#cl-nro') as HTMLInputElement;
    input.value = '12a-3';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('123');
    expect(fixture.componentInstance.filtros.controls.nroDocLiq.value).toBe('123');
    input.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.filtros.controls.nroDocLiq.value).toBe('000000000123');
  });

  it('no busca con fechas vacías y muestra * REQUERIDO', async () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.filtros.patchValue({ fechaIni: null });
    await c.buscar();
    fixture.detectChanges();
    expect(liquidaciones.listarLiquidacionesPorFiltro).not.toHaveBeenCalled();
    expect(document.querySelector('#cl-fini-error')?.textContent).toContain('* REQUERIDO');
  });

  it('los combos tienen nombre accesible', () => {
    crear();
    expect(document.querySelector('[role="combobox"]#cl-estado')?.getAttribute('aria-labelledby')).toBe('cl-estado-label');
    expect(document.querySelector('[role="combobox"]#cl-origen')?.getAttribute('aria-labelledby')).toBe('cl-origen-label');
  });

  it('error al buscar: muestra errorMessage y vacía la tabla', async () => {
    const c = crear().componentInstance;
    await c.buscar();
    liquidaciones.listarLiquidacionesPorFiltro.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E', errorMessage: 'Rango inválido' } })),
    );
    await c.buscar();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'Rango inválido');
    expect(c.filas()).toEqual([]);
  });

  it('error sin cuerpo: mensaje genérico de v1', async () => {
    liquidaciones.listarLiquidacionesPorFiltro.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const c = crear().componentInstance;
    await c.buscar();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'Error de comunicación con los servicios. Intenta nuevamente.');
  });

  it('eliminar confirmado: llama al servicio, avisa y vuelve a buscar', async () => {
    confirmar.mockResolvedValue(true);
    liquidaciones.eliminarLiquidacionBD.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Eliminada' }));
    const c = crear().componentInstance;
    await c.buscar();
    const fila = c.filas()[0];
    await c.alAccion({ accion: 'eliminar', fila });
    expect(confirmar).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Confirma eliminar la liquidacion :  000000000001  ?' }),
    );
    expect(liquidaciones.eliminarLiquidacionBD).toHaveBeenCalledWith(5, fila);
    expect(avisos.exito).toHaveBeenCalledWith('Eliminada');
    expect(liquidaciones.listarLiquidacionesPorFiltro).toHaveBeenCalledTimes(2);
  });

  it('eliminar cancelado: no llama al servicio', async () => {
    confirmar.mockResolvedValue(false);
    const c = crear().componentInstance;
    await c.buscar();
    await c.alAccion({ accion: 'eliminar', fila: c.filas()[0] });
    expect(liquidaciones.eliminarLiquidacionBD).not.toHaveBeenCalled();
  });

  it('eliminar con error: muestra errorMessage y no vuelve a buscar', async () => {
    confirmar.mockResolvedValue(true);
    liquidaciones.eliminarLiquidacionBD.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { codeMessage: 'E', errorMessage: 'Tiene factura' } })),
    );
    const c = crear().componentInstance;
    await c.buscar();
    await c.alAccion({ accion: 'eliminar', fila: c.filas()[0] });
    expect(avisos.error).toHaveBeenCalledWith('Error', 'Tiene factura');
    expect(liquidaciones.listarLiquidacionesPorFiltro).toHaveBeenCalledTimes(1);
  });

  it('exportar envía todas las filas de la consulta a ExcelService', async () => {
    const c = crear().componentInstance;
    await c.buscar();
    await c.exportar();
    expect(excel.generarReporteLiquidaciones).toHaveBeenCalledWith(lista);
  });

  it('abrir navega al registro con nroDocLiq', async () => {
    const fixture = crear();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.componentInstance.buscar();
    await fixture.componentInstance.alAccion({ accion: 'ver', fila: fixture.componentInstance.filas()[0] });
    expect(navegar).toHaveBeenCalledWith(['/forms/liquidacion'], { queryParams: { nroDocLiq: '000000000001' } });
  });
});
