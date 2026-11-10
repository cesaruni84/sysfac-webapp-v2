import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuiaRemision } from '../../models';

const autoTableMock = vi.hoisted(() => vi.fn());
vi.mock('jspdf-autotable', () => ({
  autoTable: (doc: { lastAutoTable?: { finalY: number } }, opts: unknown) => {
    doc.lastAutoTable = { finalY: 100 };
    autoTableMock(doc, opts);
  },
  default: undefined,
}));

import {
  COLUMNAS_PDF_LIQUIDACION,
  PdfService,
  formatearDecimal,
  formatearFecha,
  simboloMoneda,
  type LiquidacionPdfDatos,
} from './pdf.service';

function guia(idProducto: string, cantidad: number, tarifa: number, serie: string): GuiaRemision {
  return {
    idProducto,
    serie,
    secuencia: '0001',
    serieCliente: 'C',
    secuenciaCliente: '9',
    fechaTraslado: '2020-02-01',
    ticketBalanza: 'TB',
    totalCantidad: cantidad,
    tarifa,
    subTotal: cantidad * tarifa,
    remitente: { refLarga2: 'Planta A' },
    destinatario: { refLarga2: 'Planta B' },
    guiaDetalle: [{ producto: { nombre: 'Maíz ' + idProducto } as never, unidadMedida: { id: 1, valor: 'TN', descripcion: 'Tonelada' } }],
  };
}

const datos: LiquidacionPdfDatos = {
  empresa: { razonSocial: 'Mi Empresa', ruc: '20123456789' },
  fechaRegistro: '2020-02-10',
  nroDocumento: 'LIQ-001',
  moneda: '0',
  monedaDescripcion: 'SOLES (S/)',
  estadoDescripcion: 'VIGENTE',
  situacionDescripcion: 'PENDIENTE',
  fechaIniTraslado: '2020-02-01',
  fechaFinTraslado: '2020-02-05',
  motivoTraslado: { codigo: '01', descripcion: 'Venta' },
  guias: [guia('1', 10, 2, 'T1'), guia('1', 5, 3, 'T2'), guia('2', 1, 100, 'T3')],
  igvAplicado: 27.9,
  totalImporte: 182.9,
};

describe('PdfService', () => {
  let servicio: PdfService;

  beforeEach(() => {
    autoTableMock.mockClear();
    servicio = TestBed.inject(PdfService);
  });

  it('invoca autoTable una vez por producto con las columnas y filas de v1', async () => {
    const pdf = await servicio.construirPdfLiquidacion(datos);

    expect(autoTableMock).toHaveBeenCalledTimes(2);
    const [, opciones] = autoTableMock.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(opciones['columns']).toEqual(COLUMNAS_PDF_LIQUIDACION.map((c) => ({ ...c })));
    expect((opciones['columns'] as { header: string }[]).map((c) => c.header)).toEqual([
      'Item', 'F.Traslado', 'Guia de Remisión', 'Guia Rem. Cliente', 'Descripción', 'Cantidad', 'UM', 'P.Unitario', 'Sub Total',
    ]);
    expect(opciones['theme']).toBe('striped');
    expect(opciones['showHead']).toBe('firstPage');
    expect(opciones['styles']).toEqual({ overflow: 'ellipsize', cellWidth: 'wrap', fontSize: 8 });
    expect(opciones['body']).toEqual([
      {
        id: 1, fechaTraslado: '2020-02-01', guiaRemision: 'T1-0001', guiaCliente: 'C-9', descripcion: 'Maíz 1',
        ticketBalanza: 'TB', cantidad: '10.00', unidadMedida: 'TN', tarifa: '2.00', subTotal: '20.00',
      },
      {
        id: 2, fechaTraslado: '2020-02-01', guiaRemision: 'T2-0001', guiaCliente: 'C-9', descripcion: 'Maíz 1',
        ticketBalanza: 'TB', cantidad: '5.00', unidadMedida: 'TN', tarifa: '3.00', subTotal: '15.00',
      },
    ]);
    const [, opciones2] = autoTableMock.mock.calls[1] as [unknown, { body: unknown[] }];
    expect(opciones2.body).toHaveLength(1);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('descarga con el nombre de archivo de v1', async () => {
    const nombres: string[] = [];
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:fake', revokeObjectURL: () => undefined });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      nombres.push(this.download);
    });

    await servicio.generarPdfLiquidacion(datos);

    expect(nombres).toEqual(['ReporteLiquidacion_LIQ-001__.pdf']);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('helpers de presentación', () => {
    expect(formatearFecha('2020-02-10')).toBe('10/02/2020');
    expect(formatearFecha(new Date(2021, 0, 5))).toBe('05/01/2021');
    expect(formatearFecha(undefined)).toBe('');
    expect(formatearDecimal(1234.5)).toBe('1,234.50');
    expect(simboloMoneda('1')).toBe('$');
    expect(simboloMoneda('0')).toBe('S/');
  });
});
