import { formatDate } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import {
  Documento,
  EstadoDocumento,
  GLOSA_TRANSPORTE,
  TipoFactura,
  type ErrorResponse,
  type TipoDocumento,
} from '../../core/models';
import type { ColumnaTabla } from '../../shared/ui';

/** Mensaje genérico de v1 (`handleError` de consulta/auditoría) cuando no llega `errorMessage`. */
export const MENSAJE_ERROR_GENERICO = 'Error de comunicación con los servicios. Intenta nuevamente.';

/** Documento + campos calculados SOLO para mostrar y buscar en la grilla (nunca se envían). */
export type FilaDocumento = Documento & {
  tipoDocGlosa: string;
  estadoGlosa: string;
  glosa: string;
};

/** Texto para el usuario: `errorMessage` del backend o el genérico de v1. */
export function mensajeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const cuerpo = e.error as Partial<ErrorResponse> | null;
    if (cuerpo && typeof cuerpo === 'object' && cuerpo.errorMessage) return cuerpo.errorMessage;
  }
  return MENSAJE_ERROR_GENERICO;
}

/** `formatDate(valor, 'yyyy-MM-dd', locale)` de v1 (fecha local del navegador). */
export function fechaFiltro(valor: Date): string {
  return formatDate(valor, 'yyyy-MM-dd', 'en-US');
}

/** `getValueGlosaEstado` de v1. */
export function glosaEstado(estado: number | undefined): string {
  switch (estado) {
    case EstadoDocumento.REGISTRADO:
      return 'Registrado';
    case EstadoDocumento.CANCELADO:
      return 'Cancelado';
    case EstadoDocumento.ANULADO:
      return 'Anulado';
    default:
      return '?';
  }
}

/** `retornarLiteralTipoDocumento` de v1 (descripción del catálogo o '?'). */
export function glosaTipoDocumento(tipos: readonly TipoDocumento[], id: number | undefined): string {
  return tipos.find((t) => t.id === id)?.descripcion ?? '?';
}

/** `retornarGlosa` de v1 (vacía cuando `notas` no es ninguno de los tipos conocidos). */
export function glosaDocumento(doc: Documento): string {
  switch (doc.notas) {
    case TipoFactura.ITEM:
      return doc.observacion ?? '';
    case TipoFactura.CON_LIQUIDACION:
    case TipoFactura.CON_GUIAREMISION:
      return doc.estado === EstadoDocumento.ANULADO
        ? `${doc.observacion} / ${GLOSA_TRANSPORTE}`
        : GLOSA_TRANSPORTE;
    default:
      return '';
  }
}

/** Agrega a cada documento las glosas calculadas. */
export function aFilas(docs: readonly Documento[], tipos: readonly TipoDocumento[]): FilaDocumento[] {
  return docs.map((d) => ({
    ...d,
    tipoDocGlosa: glosaTipoDocumento(tipos, d.tipoDocumento),
    estadoGlosa: glosaEstado(d.estado),
    glosa: glosaDocumento(d),
  }));
}

/** Parámetros de `/forms/facturacion/registro` (idénticos a `consultarDocumento` de v1). */
export function paramsRegistro(fila: Documento): { tipoDoc?: number; serie?: string; secuencia?: string } {
  return { tipoDoc: fila.tipoDocumento, serie: fila.serie, secuencia: fila.secuencia };
}

/** Columnas comunes de consulta y auditoría (la F. Vencimiento está comentada en la grilla de v1). */
export function columnasDocumento(): ColumnaTabla<FilaDocumento>[] {
  return [
    { campo: 'tipoDocGlosa', id: 'tipoDoc', titulo: 'Tipo Doc.', ancho: '8rem' },
    { campo: 'serie', titulo: 'Serie', ancho: '6rem' },
    { campo: 'secuencia', titulo: 'Correlativo', ancho: '8rem' },
    { campo: 'cliente.razonSocial', titulo: 'Cliente', ancho: '16rem' },
    { campo: 'fechaEmision', titulo: 'F. Emisión', tipo: 'fecha', ancho: '8rem' },
    {
      campo: 'estadoGlosa',
      id: 'estado',
      titulo: 'Estado Doc.',
      tipo: 'tag',
      ancho: '8rem',
      // v1: registrado = primary, cancelado = accent, anulado = warn.
      tag: (v, f) => ({
        texto: String(v),
        severidad:
          f.estado === EstadoDocumento.REGISTRADO
            ? 'info'
            : f.estado === EstadoDocumento.CANCELADO
              ? 'success'
              : f.estado === EstadoDocumento.ANULADO
                ? 'danger'
                : 'secondary',
      }),
    },
    {
      campo: 'totalDocumento',
      titulo: 'Importe',
      tipo: 'moneda',
      alineacion: 'centro',
      moneda: (f) => f.moneda?.nemonico ?? '',
      ancho: '8rem',
    },
    { campo: 'glosa', titulo: 'Glosa', ancho: '14rem' },
  ];
}
