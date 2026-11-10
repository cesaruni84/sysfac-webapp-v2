import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuiaRemision } from '../../models';

const autoTableMock = vi.hoisted(() => vi.fn());
const finalYMock = vi.hoisted(() => ({ valor: 100 }));
// jsPDF define `text` y `addPage` por instancia (no en el prototipo), así que se envuelve la clase
// para registrar las llamadas.
const jsPdfEspias = vi.hoisted(() => ({ text: [] as string[], addPage: 0 }));
vi.mock('jspdf', async (importOriginal) => {
  const original = await importOriginal<typeof import('jspdf')>();
  class JsPdfEspia extends original.jsPDF {
    constructor(...args: ConstructorParameters<typeof original.jsPDF>) {
      super(...args);
      const text = this.text.bind(this);
      this.text = ((t: unknown, ...resto: unknown[]) => {
        jsPdfEspias.text.push(String(t));
        return (text as (...a: unknown[]) => unknown)(t, ...resto);
      }) as typeof this.text;
      const addPage = this.addPage.bind(this);
      this.addPage = ((...a: Parameters<typeof addPage>) => {
        jsPdfEspias.addPage++;
        return addPage(...a);
      }) as typeof this.addPage;
    }
  }
  return { ...original, jsPDF: JsPdfEspia };
});
vi.mock('jspdf-autotable', () => ({
  autoTable: (doc: { lastAutoTable?: { finalY: number } }, opts: unknown) => {
    doc.lastAutoTable = { finalY: finalYMock.valor };
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
    finalYMock.valor = 100;
    jsPdfEspias.text = [];
    jsPdfEspias.addPage = 0;
    servicio = TestBed.inject(PdfService);
  });

  afterEach(() => vi.restoreAllMocks());

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

  describe('textos del PDF', () => {
    const textos = () => jsPdfEspias.text;

    it('imprime subtotales por grupo, totales generales, IGV y motivo de traslado', async () => {
      await servicio.construirPdfLiquidacion(datos);
      const t = textos();

      // Subtotal por grupo: 10*2 + 5*3 = 35 (grupo 1) y 100 (grupo 2)
      expect(t).toContain('S/ 35.00');
      expect(t).toContain('S/ 100.00');
      expect(t).toContain('TOTAL CANTIDAD :');
      expect(t).toContain('TOTAL ITEMS : ');
      expect(t).toContain('3');
      expect(t).toContain('16.00');
      expect(t).toContain('S/ 135.00'); // SUB TOTAL general
      expect(t).toContain('I.G.V. :');
      expect(t).toContain('S/ 27.90');
      expect(t).toContain('TOTAL :');
      expect(t).toContain('S/ 182.90');
      expect(t).toContain('MOTIVO TRASLADO :');
      expect(t).toContain('01 - Venta');
    });

    it('usa separador de miles en los totales generales', async () => {
      const grande: LiquidacionPdfDatos = {
        ...datos,
        guias: [guia('1', 100, 12.345, 'T1')],
        igvAplicado: 1000,
        totalImporte: 2234.5,
      };
      await servicio.construirPdfLiquidacion(grande);
      const t = textos();

      // Por grupo no lleva separador; el general sí.
      expect(t).toContain('S/ 1234.50');
      expect(t).toContain('S/ 1,234.50');
      expect(t).toContain('S/ 1,000.00');
      expect(t).toContain('S/ 2,234.50');
    });

    it("usa el símbolo $ cuando la moneda es '1'", async () => {
      await servicio.construirPdfLiquidacion({ ...datos, moneda: '1' });
      const t = textos();

      expect(t).toContain('$ 35.00');
      expect(t).toContain('$ 135.00');
      expect(t).toContain('$ 182.90');
      expect(t.some((x) => x.startsWith('S/'))).toBe(false);
    });

    it('agrega página al cortar un grupo (y > 160)', async () => {
      finalYMock.valor = 150; // tras el primer grupo y = 165; el siguiente empieza en 175 > 160
      const pdf = await servicio.construirPdfLiquidacion(datos);

      expect(jsPdfEspias.addPage).toBeGreaterThan(0);
      expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    });

    it('agrega página antes del bloque de totales (y > 0.75 * alto)', async () => {
      finalYMock.valor = 145; // un solo grupo: y = 160 > 157.5 antes de los totales
      const pdf = await servicio.construirPdfLiquidacion({ ...datos, guias: [guia('1', 10, 2, 'T1')] });

      expect(jsPdfEspias.addPage).toBe(1);
      expect(pdf.getNumberOfPages()).toBe(2);
      expect(textos()).toContain('TOTAL ITEMS : ');
    });
  });

  it('helpers de presentación', () => {
    expect(formatearFecha('2020-02-10')).toBe('10/02/2020');
    expect(formatearFecha(new Date(2021, 0, 5))).toBe('05/01/2021');
    expect(formatearFecha(undefined)).toBe('');
    expect(formatearFecha('2020-02-10T05:00:00.000+0000')).toBe('10/02/2020');
    expect(formatearFecha('2020-2-5')).toBe('05/02/2020');
    expect(formatearDecimal(1234.5)).toBe('1,234.50');
    expect(simboloMoneda('1')).toBe('$');
    expect(simboloMoneda('0')).toBe('S/');
  });
});
