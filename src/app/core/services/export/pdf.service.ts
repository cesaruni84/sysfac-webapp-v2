import { formatDate, formatNumber } from '@angular/common';
import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';
import type { RowInput, Table } from 'jspdf-autotable';
import type { FechaApi, GuiaRemision, GuiasRemisionPDF } from '../../models';
import { descargarArchivo } from './descarga';

/**
 * Datos del PDF de liquidación, ya resueltos por la pantalla. En v1 salían de
 * `FileUploadComponent` (formulario, combos y totales calculados en pantalla).
 */
export interface LiquidacionPdfDatos {
  /** `usuarioSession.empresa` */
  empresa: { razonSocial: string; ruc: string };
  /** Fecha de registro de la liquidación (`valorFechaRegistro_`). */
  fechaRegistro: FechaApi | null | undefined;
  /** `nroDocumentoLiq` */
  nroDocumento: string;
  /**
   * Valor del combo de moneda de v1: `'0'` = SOLES, `'1'` = DOLARES. Solo se usa para el
   * símbolo (`'1'` -> `$`, cualquier otro -> `S/`), igual que v1.
   */
  moneda: string;
  /** Descripción del combo de moneda (v1: `comboMonedas`). */
  monedaDescripcion: string;
  /** Descripción del estado (v1: `comboEstadoLiq`). */
  estadoDescripcion: string;
  /** Descripción de la situación (v1: `comboSituacionLiq`). */
  situacionDescripcion: string;
  fechaIniTraslado: FechaApi | null | undefined;
  fechaFinTraslado: FechaApi | null | undefined;
  motivoTraslado: { codigo?: string; descripcion?: string };
  /** Guías de la liquidación (`rows`); se agrupan por `idProducto`. */
  guias: GuiaRemision[];
  /** `igvAplicado_` calculado por la pantalla. */
  igvAplicado: number;
  /** `totalImpGuiasLiq_` calculado por la pantalla. */
  totalImporte: number;
}

/** `jsPDF` tras `autoTable`: el plugin deja la última tabla en `lastAutoTable`. */
type jsPDFConAutoTable = jsPDF & { lastAutoTable?: Table };

export const PDF_LIQUIDACION = { prefijoArchivo: 'ReporteLiquidacion_', extension: '_.pdf' } as const;

/** Columnas de la tabla de guías (idénticas a v1). */
export const COLUMNAS_PDF_LIQUIDACION = [
  { header: 'Item', dataKey: 'id' },
  { header: 'F.Traslado', dataKey: 'fechaTraslado' },
  { header: 'Guia de Remisión', dataKey: 'guiaRemision' },
  { header: 'Guia Rem. Cliente', dataKey: 'guiaCliente' },
  { header: 'Descripción', dataKey: 'descripcion' },
  { header: 'Cantidad', dataKey: 'cantidad' },
  { header: 'UM', dataKey: 'unidadMedida' },
  { header: 'P.Unitario', dataKey: 'tarifa' },
  { header: 'Sub Total', dataKey: 'subTotal' },
] as const;

/**
 * `datePipe.transform(x, 'dd/MM/yyyy')` de v1 (vacío si no hay fecha). Usa `formatDate` con
 * `en-US`, el `LOCALE_ID` por defecto con que v1 resolvía el pipe.
 */
export function formatearFecha(valor: FechaApi | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') {
    return '';
  }
  try {
    return formatDate(valor, 'dd/MM/yyyy', 'en-US');
  } catch {
    // Fecha inválida: se deja vacío en lugar de romper la generación del PDF.
    return '';
  }
}

/** `DecimalPipe` con formato `1.2-2` de v1 (locale `en-US`). */
export function formatearDecimal(valor: number): string {
  return formatNumber(valor, 'en-US', '1.2-2');
}

/** Símbolo de moneda según el combo de v1 (`'1'` = dólares). */
export function simboloMoneda(moneda: string): string {
  return moneda === '1' ? '$' : 'S/';
}

/** Agrupa conservando el orden de aparición (`groupByKey` de v1). */
function agruparPor<T, K>(lista: T[], clave: (item: T) => K): Map<K, T[]> {
  const mapa = new Map<K, T[]>();
  lista.forEach((item) => {
    const k = clave(item);
    const coleccion = mapa.get(k);
    if (coleccion) {
      coleccion.push(item);
    } else {
      mapa.set(k, [item]);
    }
  });
  return mapa;
}

function sumar(valores: (number | undefined)[]): number {
  // `as number` reproduce v1 ante datos faltantes: `undefined` produce NaN, no se rellena con 0.
  return valores.reduce<number>((acc, valor) => acc + (valor as number), 0);
}

/**
 * PDF de liquidación (portado de `captureScreen`/`imprimirLiquidacion` de
 * `file-upload.component.ts` de v1). jsPDF y autoTable se cargan de forma diferida.
 *
 * Cálculos presentes en el PDF de v1 (solo sumas de presentación, se conservan aquí): total de
 * cantidad y subtotal por grupo de producto, y total de ítems/cantidad/subtotal general.
 * El IGV y el total final llegan ya calculados por la pantalla (`igvAplicado`, `totalImporte`).
 */
@Injectable({ providedIn: 'root' })
export class PdfService {
  /** Genera y descarga el PDF (v1: `documento.save(...)`). */
  async generarPdfLiquidacion(datos: LiquidacionPdfDatos): Promise<void> {
    const documento = await this.construirPdfLiquidacion(datos);
    const nombre = PDF_LIQUIDACION.prefijoArchivo + datos.nroDocumento + '_' + PDF_LIQUIDACION.extension;
    descargarArchivo(documento.output('blob'), nombre);
  }

  /** Construye el documento en memoria (sin descargar). */
  async construirPdfLiquidacion(datos: LiquidacionPdfDatos): Promise<jsPDF> {
    const [{ jsPDF: JsPdfCtor }, autoTableModulo] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const autoTable = autoTableModulo.autoTable ?? autoTableModulo.default;

    const documento = new JsPdfCtor('landscape');
    let initialMarginY = 15;
    const initialMarginX = 15;
    const defaulMarginY = 15;
    const defaultBreakPage = 160;
    const pageWidth = documento.internal.pageSize.getWidth();
    const pageHeight = documento.internal.pageSize.getHeight();

    const linea = (x1: number, y: number, x2: number) => {
      documento.setLineWidth(0.1);
      documento.setDrawColor(0, 0, 0);
      documento.setLineDashPattern([0.5], 0);
      documento.line(x1, y, x2, y);
    };
    const etiqueta = (texto: string, x: number, y: number) => {
      documento.setFont('Calibri', 'bold');
      documento.text(texto, x, y);
    };
    const valor = (texto: string, x: number, y: number) => {
      documento.setFont('Calibri', 'normal');
      documento.text(texto, x, y);
    };

    // TITULO
    documento.setTextColor(45, 45, 45);
    documento.setFontSize(14);
    documento.setFont('Calibri', 'bold');
    documento.text('REPORTE DE LIQUIDACION', pageWidth * 0.5, initialMarginY, { align: 'center' });
    initialMarginY = initialMarginY + 5;

    // LINEA 0
    linea(initialMarginX, initialMarginY, pageWidth * 0.95);

    // LINEA 1
    initialMarginY = initialMarginY + 10;
    documento.setFontSize(9);
    etiqueta('EMPRESA :', initialMarginX, initialMarginY);
    valor(datos.empresa.razonSocial + ' - RUC ' + datos.empresa.ruc, initialMarginX + 25, initialMarginY);
    etiqueta('FECHA REGISTRO :', pageWidth * 0.72, initialMarginY);
    valor(formatearFecha(datos.fechaRegistro), pageWidth * 0.85, initialMarginY);

    // LINEA 2
    initialMarginY = initialMarginY + 10;
    documento.setFontSize(9);
    etiqueta('NRO. DE DOCUMENTO :', initialMarginX, initialMarginY);
    valor(datos.nroDocumento, initialMarginX + 45, initialMarginY);
    etiqueta('MONEDA :', pageWidth * 0.33, initialMarginY);
    valor(datos.monedaDescripcion, pageWidth * 0.4, initialMarginY);
    etiqueta('ESTADO :', pageWidth * 0.52, initialMarginY);
    valor(datos.estadoDescripcion, pageWidth * 0.59, initialMarginY);
    etiqueta('SITUACION :', pageWidth * 0.72, initialMarginY);
    valor(datos.situacionDescripcion, pageWidth * 0.81, initialMarginY);

    // LINEA 3
    initialMarginY = initialMarginY + 10;
    etiqueta('FECHA INI TRASLADO :', initialMarginX, initialMarginY);
    valor(formatearFecha(datos.fechaIniTraslado), initialMarginX + 45, initialMarginY);
    etiqueta('FECHA FIN TRASLADO :', pageWidth * 0.33, initialMarginY);
    valor(formatearFecha(datos.fechaFinTraslado), pageWidth * 0.48, initialMarginY);
    etiqueta('MOTIVO TRASLADO :', pageWidth * 0.6, initialMarginY);
    valor(`${datos.motivoTraslado.codigo} - ${datos.motivoTraslado.descripcion}`, pageWidth * 0.72, initialMarginY);

    const listadoGuias = datos.guias;
    const simbolo = simboloMoneda(datos.moneda);

    const grouped = agruparPor(listadoGuias, (guia) => guia.idProducto);
    const sizeGroup = grouped.size;
    let index = 0;
    grouped.forEach((guiasDelGrupo) => {
      initialMarginY = initialMarginY + 10;
      index = index + 1;

      if (initialMarginY > defaultBreakPage) {
        documento.addPage();
        initialMarginY = defaulMarginY;
      }
      linea(initialMarginX, initialMarginY, pageWidth * 0.95);
      initialMarginY = initialMarginY + 10;

      // Origen - Destino - Insumo
      documento.setFontSize(8.5);
      etiqueta('ORIGEN :', initialMarginX, initialMarginY);
      valor(guiasDelGrupo[0].remitente?.refLarga2 ?? '', initialMarginX + 20, initialMarginY);
      etiqueta('DESTINO :', pageWidth * 0.37, initialMarginY);
      valor(guiasDelGrupo[0].destinatario?.refLarga2 ?? '', pageWidth * 0.43, initialMarginY);
      etiqueta('INSUMO :', pageWidth * 0.7, initialMarginY);
      valor(guiasDelGrupo[0].guiaDetalle?.[0]?.producto?.nombre ?? '', pageWidth * 0.76, initialMarginY);

      // Formateo de campos. Los `as number` reproducen v1: si falta el dato, `.toFixed` lanza
      // igual que allí (no se rellena con 0).
      const lista: GuiasRemisionPDF[] = guiasDelGrupo.map((guia, i) => ({
        id: i + 1,
        fechaTraslado: String(guia.fechaTraslado),
        guiaRemision: guia.serie + '-' + guia.secuencia,
        guiaCliente: guia.serieCliente + '-' + guia.secuenciaCliente,
        descripcion: guia.guiaDetalle?.[0]?.producto?.nombre,
        ticketBalanza: guia.ticketBalanza,
        cantidad: (guia.totalCantidad as number).toFixed(2),
        unidadMedida: guia.guiaDetalle?.[0]?.unidadMedida?.valor,
        tarifa: (guia.tarifa as number).toFixed(2),
        subTotal: (guia.subTotal as number).toFixed(2),
      }));

      // Tabla por origen-destino
      autoTable(documento, {
        columnStyles: { id: { halign: 'center' }, text: { cellWidth: 'auto' } },
        body: lista as RowInput[],
        styles: { overflow: 'ellipsize', cellWidth: 'wrap', fontSize: 8 },
        theme: 'striped',
        startY: initialMarginY + 7,
        showHead: 'firstPage',
        pageBreak: 'auto',
        columns: COLUMNAS_PDF_LIQUIDACION.map((c) => ({ ...c })),
      });

      const totalCantidad = sumar(guiasDelGrupo.map((t) => t.totalCantidad));
      const totalImportes = sumar(guiasDelGrupo.map((t) => t.subTotal));
      const ultimaTabla = (documento as jsPDFConAutoTable).lastAutoTable;
      initialMarginY = (ultimaTabla?.finalY ?? initialMarginY) + 10;
      documento.setTextColor(0, 0, 255);
      etiqueta('TOTAL CANTIDAD :', pageWidth * 0.52, initialMarginY);
      valor(totalCantidad.toFixed(2), pageWidth * 0.65, initialMarginY);
      etiqueta('SUB TOTAL :', pageWidth * 0.76, initialMarginY);
      valor(simbolo + ' ' + totalImportes.toFixed(2), pageWidth * 0.85, initialMarginY);
      initialMarginY = initialMarginY + 5;
      documento.setTextColor(44, 44, 44);

      if (index === sizeGroup) {
        if (initialMarginY > 0.75 * pageHeight) {
          documento.addPage();
          initialMarginY = 10;
        }

        documento.setFontSize(9.5);
        linea(initialMarginX, initialMarginY, pageWidth * 0.95);
        documento.line(initialMarginX, initialMarginY + 1, pageWidth * 0.95, initialMarginY + 1);
        initialMarginY = initialMarginY + 10;
        const granTotalCantidad = sumar(listadoGuias.map((t) => t.totalCantidad));
        const granTotalImportes = sumar(listadoGuias.map((t) => t.subTotal));
        const granTotalItems = listadoGuias.length;

        etiqueta('TOTAL ITEMS : ', initialMarginX, initialMarginY);
        valor(granTotalItems.toString(), pageWidth * 0.15, initialMarginY);

        etiqueta('TOTAL CANTIDAD :', pageWidth * 0.52, initialMarginY);
        valor(granTotalCantidad.toFixed(2), pageWidth * 0.65, initialMarginY);

        etiqueta('SUB TOTAL :', pageWidth * 0.76, initialMarginY);
        valor(simbolo + ' ' + formatearDecimal(Number(granTotalImportes.toFixed(2))), pageWidth * 0.85, initialMarginY);

        initialMarginY = initialMarginY + 10;
        etiqueta('I.G.V. :', pageWidth * 0.76, initialMarginY);
        valor(simbolo + ' ' + formatearDecimal(Number(datos.igvAplicado.toFixed(2))), pageWidth * 0.85, initialMarginY);

        initialMarginY = initialMarginY + 5;
        linea(pageWidth * 0.76, initialMarginY, pageWidth * 0.95);

        initialMarginY = initialMarginY + 10;
        etiqueta('TOTAL :', pageWidth * 0.76, initialMarginY);
        documento.setFontSize(10);
        documento.text(
          simbolo + ' ' + formatearDecimal(Number(datos.totalImporte.toFixed(2))),
          pageWidth * 0.85,
          initialMarginY,
        );

        initialMarginY = initialMarginY + 10;
        linea(initialMarginX, initialMarginY, pageWidth * 0.95);
      }
    });

    return documento;
  }
}
