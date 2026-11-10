import { Injectable } from '@angular/core';
import type { Workbook, Worksheet } from 'exceljs';
import {
  EstadoLiquidacion,
  GLOSA_TRANSPORTE,
  TipoFactura,
  TiposGenericosDB,
  type Documento,
  type FechaApi,
  type GrillaGuiaRemision,
  type Liquidacion,
} from '../../models';
import { MIME_XLSX, descargarArchivo, fechaParaNombreArchivo } from './descarga';

/**
 * Fila del reporte de liquidaciones (clase `LiquidacionReportExcel` de
 * `excel.service.ts` de v1; distinta de la de `core/models/liquidacion.model.ts`).
 */
export interface LiquidacionReportExcel {
  item?: number;
  nrodoc?: string;
  fechaEmision?: Date;
  factura?: string;
  origen?: string;
  destino?: string;
  estado?: string;
  importeTotal?: number;
}

/** Fila del reporte de facturación (`DocumentosReportExcel` de v1). */
export interface DocumentosReportExcel {
  tipoDoc?: string;
  serie?: string;
  secuencia?: string;
  cliente?: string;
  fechaEmision?: Date;
  fechaVencimiento?: Date;
  estado?: string;
  moneda?: string;
  totalDocumento?: number;
  observacion?: string;
}

/**
 * Fila del reporte de guías: la grilla del backend (`GrillaGuiaRemision`) más los
 * campos `factura` y `nemonicoEstadoFactura` que el backend también envía y que
 * el reporte de v1 lee (v1 pasaba `this.rows` sin tipar).
 */
export type GuiaRemisionFilaExcel = Partial<GrillaGuiaRemision> & {
  factura?: string;
  nemonicoEstadoFactura?: string;
};

/** Metadatos de cada reporte (hoja y prefijo del archivo, como en v1). */
export const REPORTE_GUIAS = { hoja: 'Reporte de Guias', prefijoArchivo: 'ReporteGuias_' } as const;
export const REPORTE_LIQUIDACIONES = {
  hoja: 'Reporte de Liquidaciones',
  prefijoArchivo: 'ReporteLiquidaciones_',
} as const;
export const REPORTE_FACTURACION = {
  hoja: 'Reporte de Facturaciones',
  prefijoArchivo: 'ReporteFacturacion_',
} as const;
export const EXTENSION_XLSX = '_.xlsx';

const FORMATO_FECHA = 'dd/mm/yyyy';
// Copiado de v1 tal cual: en el fuente era `\-`, que en una cadena JS equivale a `-`.
const FORMATO_IMPORTE_SOLES = '"S/"#,##0.00;[Red]-"£"#,##0.00';
const FORMATO_IMPORTE = '#,##0.00;[Red]-"£"#,##0.00';

interface ColumnaExcel {
  header: string;
  key: string;
  width: number;
  style?: { numFmt: string };
}

export const COLUMNAS_GUIAS: readonly ColumnaExcel[] = [
  { header: 'Item', key: 'id', width: 10 },
  { header: 'Serie Guia', key: 'nroguia', width: 15 },
  { header: 'Secuencia Guia', key: 'nroSecuencia', width: 20 },
  { header: 'Fecha Emisión', key: 'fechaEmision', width: 20, style: { numFmt: FORMATO_FECHA } },
  { header: 'Usuario Registra', key: 'usuarioRegistra', width: 20 },
  { header: 'Nro. de Liquidación', key: 'nroLiq', width: 22 },
  { header: 'Factura', key: 'factura', width: 20 },
  { header: 'Estado Factura', key: 'nemonicoEstadoFactura', width: 17 },
  { header: 'Estado Guia', key: 'estado', width: 17 },
  { header: 'Remitente', key: 'remitente', width: 40 },
  { header: 'Destinatario', key: 'destinatario', width: 40 },
  { header: 'Producto', key: 'producto', width: 40 },
  { header: 'Cantidad', key: 'cantidad', width: 20 },
  { header: 'Chofer', key: 'chofer', width: 40 },
  { header: 'Nro.Guia Cliente', key: 'nroGuiaCliente', width: 20 },
  { header: 'Fecha Recepción', key: 'fechaRecepcion', width: 20, style: { numFmt: FORMATO_FECHA } },
];

export const COLUMNAS_LIQUIDACIONES: readonly ColumnaExcel[] = [
  { header: 'Item', key: 'item', width: 10 },
  { header: 'Nro. Liquidación', key: 'nrodoc', width: 20 },
  { header: 'F. Emisión Liq.', key: 'fechaEmision', width: 16, style: { numFmt: FORMATO_FECHA } },
  { header: 'Factura', key: 'factura', width: 20 },
  { header: 'Origen', key: 'origen', width: 43 },
  { header: 'Destino', key: 'destino', width: 43 },
  { header: 'Estado', key: 'estado', width: 14 },
  { header: 'Total Importe', key: 'importeTotal', width: 25, style: { numFmt: FORMATO_IMPORTE_SOLES } },
];

export const COLUMNAS_FACTURACION: readonly ColumnaExcel[] = [
  { header: 'Tipo Documento', key: 'tipoDoc', width: 20 },
  { header: 'Serie Doc.', key: 'serie', width: 20 },
  { header: 'Secuencia Doc', key: 'secuencia', width: 20 },
  { header: 'Cliente', key: 'cliente', width: 50 },
  { header: 'F. Emisión', key: 'fechaEmision', width: 16, style: { numFmt: FORMATO_FECHA } },
  { header: 'F. Vencimiento', key: 'fechaVencimiento', width: 16, style: { numFmt: FORMATO_FECHA } },
  { header: 'Estado', key: 'estado', width: 16 },
  { header: 'Moneda', key: 'moneda', width: 16 },
  { header: 'Importe', key: 'totalDocumento', width: 25, style: { numFmt: FORMATO_IMPORTE } },
  { header: 'Glosa/Observación', key: 'observacion', width: 50 },
];

/** Convierte una fecha del contrato (`Date | string`) igual que v1: `new Date(x.toString())`. */
function aFecha(valor: FechaApi): Date {
  return new Date(valor.toString());
}

function bordeFino() {
  return {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  } as const;
}

/**
 * Exportaciones a Excel (portado de `excel.service.ts` de v1).
 *
 * - ExcelJS se carga de forma diferida (`import('exceljs')`) para no inflar el bundle inicial.
 * - `construir*` genera el libro en memoria (testeable) y `generar*` además lo descarga.
 * - No depende de `TiposGenericosService` (2.2): usa los catálogos de `TiposGenericosDB`
 *   (mismos datos que `retornarTiposDocumento`/`retornarEstadosDocumento` de v1).
 */
@Injectable({ providedIn: 'root' })
export class ExcelService {
  private readonly catalogos = new TiposGenericosDB();

  /** Reporte de guías (v1: `paging-table.component.ts`, `ExportTOExcel`). */
  async generarReporteGuiasRemision(values: GuiaRemisionFilaExcel[]): Promise<void> {
    const libro = await this.construirReporteGuiasRemision(values);
    await this.descargar(libro, REPORTE_GUIAS.prefijoArchivo);
  }

  /** Reporte de liquidaciones (v1: `rich-text-editor.component.ts`). */
  async generarReporteLiquidaciones(values: Liquidacion[]): Promise<void> {
    const libro = await this.construirReporteLiquidaciones(values);
    await this.descargar(libro, REPORTE_LIQUIDACIONES.prefijoArchivo);
  }

  /** Reporte de facturación (v1: `factura-consulta.component.ts`). */
  async generarReporteFacturacion(values: Documento[]): Promise<void> {
    const libro = await this.construirReporteFacturacion(values);
    await this.descargar(libro, REPORTE_FACTURACION.prefijoArchivo);
  }

  async construirReporteGuiasRemision(values: GuiaRemisionFilaExcel[]): Promise<Workbook> {
    const { libro, hoja } = await this.crearLibro(REPORTE_GUIAS.hoja, COLUMNAS_GUIAS);
    // v1 añade las filas del backend tal cual (sin transformar fechas).
    hoja.addRows(values);
    this.decorar(hoja);
    return libro;
  }

  async construirReporteLiquidaciones(values: Liquidacion[]): Promise<Workbook> {
    const { libro, hoja } = await this.crearLibro(REPORTE_LIQUIDACIONES.hoja, COLUMNAS_LIQUIDACIONES);

    values.forEach((liquidacion, index) => {
      const fila: LiquidacionReportExcel = {};
      fila.item = index + 1;
      fila.nrodoc = liquidacion.nrodoc;
      if (liquidacion.fechaEmision) {
        fila.fechaEmision = aFecha(liquidacion.fechaEmision);
      }
      if (liquidacion.documento) {
        fila.factura = liquidacion.documento.serie + '-' + liquidacion.documento.secuencia;
      }
      fila.origen = liquidacion.origen?.refLarga1;
      fila.destino = liquidacion.destino?.refLarga1;
      fila.estado = liquidacion.estado === undefined ? undefined : EstadoLiquidacion[liquidacion.estado];
      fila.importeTotal = liquidacion.importeTotal;
      hoja.addRow(fila);
    });

    this.decorar(hoja);
    return libro;
  }

  async construirReporteFacturacion(values: Documento[]): Promise<Workbook> {
    const { libro, hoja } = await this.crearLibro(REPORTE_FACTURACION.hoja, COLUMNAS_FACTURACION);

    values.forEach((documento) => {
      const fila: DocumentosReportExcel = {};
      fila.tipoDoc = this.catalogos.tiposDocumentoDB.find((o) => o.id === documento.tipoDocumento)?.descripcion || '?';
      fila.serie = documento.serie;
      fila.secuencia = documento.secuencia;
      fila.cliente = documento.cliente?.razonSocial;
      if (documento.fechaEmision) {
        fila.fechaEmision = aFecha(documento.fechaEmision);
      }
      if (documento.fechaVencimiento) {
        fila.fechaVencimiento = aFecha(documento.fechaVencimiento);
      }
      fila.estado = this.catalogos.tiposEstadoFactura.find((o) => o.id === documento.estado)?.descripcion || '?';
      fila.moneda = documento.moneda?.descripcion;
      fila.totalDocumento = documento.totalDocumento;
      if (documento.notas === TipoFactura.CON_LIQUIDACION || documento.notas === TipoFactura.CON_GUIAREMISION) {
        fila.observacion = GLOSA_TRANSPORTE;
      } else {
        fila.observacion = documento.observacion;
      }
      hoja.addRow(fila);
    });

    this.decorar(hoja);
    return libro;
  }

  private async crearLibro(
    nombreHoja: string,
    columnas: readonly ColumnaExcel[],
  ): Promise<{ libro: Workbook; hoja: Worksheet }> {
    const modulo = await import('exceljs');
    // exceljs es CommonJS: según el bundler, la clase llega en el módulo o en `default`.
    const WorkbookCtor = modulo.Workbook ?? modulo.default.Workbook;
    const libro = new WorkbookCtor();
    const hoja = libro.addWorksheet(nombreHoja);
    hoja.columns = columnas.map((c) => ({ ...c, style: c.style ? { ...c.style } : undefined }));
    return { libro, hoja };
  }

  /** Bordes y Calibri Light en todas las filas; cabecera en negrita con relleno verde. */
  private decorar(hoja: Worksheet): void {
    hoja.eachRow((fila) => {
      fila.border = bordeFino();
      fila.font = { name: 'Calibri Light', family: 4, size: 11, bold: false };
    });

    hoja.getRow(1).eachCell((celda) => {
      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E2EFDA' },
        bgColor: { argb: 'FF0000FF' },
      };
      celda.border = bordeFino();
      celda.font = { name: 'Calibri Light', family: 4, size: 11, bold: true };
    });
  }

  private async descargar(libro: Workbook, prefijo: string): Promise<void> {
    const datos = await libro.xlsx.writeBuffer();
    const blob = new Blob([datos], { type: MIME_XLSX });
    descargarArchivo(blob, prefijo + fechaParaNombreArchivo() + EXTENSION_XLSX);
  }
}
