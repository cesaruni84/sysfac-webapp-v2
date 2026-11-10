import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Workbook } from 'exceljs';
import { Documento, Liquidacion } from '../../models';
import { descargarArchivo } from './descarga';
import { ExcelService, type GuiaRemisionFilaExcel } from './excel.service';

async function releer(libro: { xlsx: { writeBuffer(): Promise<ArrayBuffer | unknown> } }) {
  const buffer = (await libro.xlsx.writeBuffer()) as ArrayBuffer;
  const leido = new Workbook();
  await leido.xlsx.load(buffer);
  return leido;
}

describe('ExcelService', () => {
  let servicio: ExcelService;

  beforeEach(() => {
    servicio = TestBed.inject(ExcelService);
  });

  it('reporte de guías: hoja, cabeceras, anchos, formatos y estilos', async () => {
    const filas: GuiaRemisionFilaExcel[] = [
      {
        id: 1,
        nroguia: 'T001',
        nroSecuencia: '000123',
        fechaEmision: '2020-01-05',
        usuarioRegistra: 'jperez',
        nroLiq: 'L-1',
        factura: 'F001-1',
        nemonicoEstadoFactura: 'REG',
        estado: 'REGISTRADO',
        remitente: 'Origen SA',
        destinatario: 'Destino SA',
        producto: 'Maíz',
        cantidad: '10.5',
        chofer: 'Juan',
        nroGuiaCliente: 'C-1',
        fechaRecepcion: '2020-01-06',
      },
    ];
    const leido = await releer(await servicio.construirReporteGuiasRemision(filas));

    expect(leido.worksheets.map((h) => h.name)).toEqual(['Reporte de Guias']);
    const hoja = leido.worksheets[0];
    expect(hoja.getRow(1).values).toEqual([
      undefined,
      'Item', 'Serie Guia', 'Secuencia Guia', 'Fecha Emisión', 'Usuario Registra', 'Nro. de Liquidación',
      'Factura', 'Estado Factura', 'Estado Guia', 'Remitente', 'Destinatario', 'Producto', 'Cantidad',
      'Chofer', 'Nro.Guia Cliente', 'Fecha Recepción',
    ]);
    expect(hoja.columns.map((c) => c.width)).toEqual([10, 15, 20, 20, 20, 22, 20, 17, 17, 40, 40, 40, 20, 40, 20, 20]);
    expect(hoja.getColumn(4).numFmt).toBe('dd/mm/yyyy');
    expect(hoja.getColumn(16).numFmt).toBe('dd/mm/yyyy');
    expect(hoja.rowCount).toBe(2);
    const fila = hoja.getRow(2);
    expect(fila.getCell(2).value).toBe('T001');
    expect(fila.getCell(7).value).toBe('F001-1');
    expect(fila.getCell(10).value).toBe('Origen SA');
    expect(fila.getCell(2).font?.name).toBe('Calibri Light');
    expect(fila.getCell(2).border?.top?.style).toBe('thin');
    const cab = hoja.getRow(1).getCell(1);
    expect(cab.font?.bold).toBe(true);
    expect(cab.fill).toMatchObject({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } });
  });

  it('reporte de liquidaciones: filas calculadas, fecha y formato de importe', async () => {
    const liquidaciones: Liquidacion[] = [
      {
        nrodoc: 'LIQ-001',
        fechaEmision: '2021-03-15T12:00:00',
        estado: 1,
        importeTotal: 1234.5,
        origen: { refLarga1: 'Planta A' },
        destino: { refLarga1: 'Planta B' },
        documento: { serie: 'F001', secuencia: '00001' },
      },
      { nrodoc: 'LIQ-002', fechaEmision: new Date(2021, 2, 16, 12), estado: 2, importeTotal: 10, origen: {}, destino: {} },
    ];
    const leido = await releer(await servicio.construirReporteLiquidaciones(liquidaciones));
    const hoja = leido.worksheets[0];

    expect(hoja.name).toBe('Reporte de Liquidaciones');
    expect(hoja.getRow(1).values).toEqual([
      undefined, 'Item', 'Nro. Liquidación', 'F. Emisión Liq.', 'Factura', 'Origen', 'Destino', 'Estado', 'Total Importe',
    ]);
    expect(hoja.columns.map((c) => c.width)).toEqual([10, 20, 16, 20, 43, 43, 14, 25]);
    expect(hoja.getColumn(3).numFmt).toBe('dd/mm/yyyy');
    expect(hoja.getColumn(8).numFmt).toBe('"S/"#,##0.00;[Red]-"£"#,##0.00');

    const f1 = hoja.getRow(2);
    expect(f1.getCell(1).value).toBe(1);
    expect(f1.getCell(2).value).toBe('LIQ-001');
    expect(f1.getCell(3).value).toBeInstanceOf(Date);
    expect(f1.getCell(4).value).toBe('F001-00001');
    expect(f1.getCell(5).value).toBe('Planta A');
    expect(f1.getCell(7).value).toBe('VIGENTE');
    expect(f1.getCell(8).value).toBe(1234.5);
    expect(hoja.getRow(3).getCell(7).value).toBe('VENCIDO');
    expect(hoja.getRow(3).getCell(4).value).toBeNull();
  });

  it('reporte de facturación: catálogos, glosa de transporte y formatos', async () => {
    const documentos: Documento[] = [
      {
        tipoDocumento: 1,
        serie: 'F001',
        secuencia: '0001',
        cliente: { razonSocial: 'Cliente SAC' } as Documento['cliente'],
        fechaEmision: '2022-05-10T10:00:00',
        fechaVencimiento: '2022-06-10T10:00:00',
        estado: 2,
        moneda: { descripcion: 'Soles (S/)' },
        totalDocumento: 999.9,
        notas: '2',
        observacion: 'ignorada',
      },
      {
        tipoDocumento: 99,
        serie: 'B001',
        secuencia: '0002',
        cliente: { razonSocial: 'Otro' } as Documento['cliente'],
        fechaEmision: new Date(2022, 4, 11, 12),
        estado: 3,
        moneda: { descripcion: 'Dólares ($)' },
        totalDocumento: 5,
        notas: '1',
        observacion: 'Obs libre',
      },
    ];
    const leido = await releer(await servicio.construirReporteFacturacion(documentos));
    const hoja = leido.worksheets[0];

    expect(hoja.name).toBe('Reporte de Facturaciones');
    expect(hoja.getRow(1).values).toEqual([
      undefined, 'Tipo Documento', 'Serie Doc.', 'Secuencia Doc', 'Cliente', 'F. Emisión', 'F. Vencimiento',
      'Estado', 'Moneda', 'Importe', 'Glosa/Observación',
    ]);
    expect(hoja.columns.map((c) => c.width)).toEqual([20, 20, 20, 50, 16, 16, 16, 16, 25, 50]);
    expect(hoja.getColumn(9).numFmt).toBe('#,##0.00;[Red]-"£"#,##0.00');
    expect(hoja.getColumn(6).numFmt).toBe('dd/mm/yyyy');

    const f1 = hoja.getRow(2);
    expect(f1.getCell(1).value).toBe('Factura');
    expect(f1.getCell(4).value).toBe('Cliente SAC');
    expect(f1.getCell(5).value).toBeInstanceOf(Date);
    expect(f1.getCell(6).value).toBeInstanceOf(Date);
    expect(f1.getCell(7).value).toBe('Cancelado');
    expect(f1.getCell(9).value).toBe(999.9);
    expect(f1.getCell(10).value).toBe('TRANSPORTE');

    const f2 = hoja.getRow(3);
    expect(f2.getCell(1).value).toBe('?');
    expect(f2.getCell(6).value).toBeNull();
    expect(f2.getCell(7).value).toBe('Anulado');
    expect(f2.getCell(10).value).toBe('Obs libre');
  });

  describe('descarga', () => {
    afterEach(() => vi.useRealTimers());

    it('descargarArchivo crea y revoca la URL del blob y usa el nombre indicado', () => {
      vi.useFakeTimers();
      const crear = vi.fn(() => 'blob:fake');
      const revocar = vi.fn();
      vi.stubGlobal('URL', { createObjectURL: crear, revokeObjectURL: revocar });
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

      descargarArchivo(new Blob(['x']), 'archivo.xlsx');

      expect(crear).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      vi.runAllTimers();
      expect(revocar).toHaveBeenCalledWith('blob:fake');
      click.mockRestore();
      vi.unstubAllGlobals();
    });

    it('generarReporteLiquidaciones descarga con prefijo y extensión de v1', async () => {
      const nombres: string[] = [];
      vi.stubGlobal('URL', { createObjectURL: () => 'blob:fake', revokeObjectURL: () => undefined });
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        nombres.push(this.download);
      });

      await servicio.generarReporteLiquidaciones([]);

      expect(nombres).toHaveLength(1);
      expect(nombres[0]).toBe('ReporteLiquidaciones_' + new Date().toLocaleDateString() + '_.xlsx');
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });
  });
});
