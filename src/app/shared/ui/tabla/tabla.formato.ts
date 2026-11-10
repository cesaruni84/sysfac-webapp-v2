import { formatDate, formatNumber } from '@angular/common';

import type { AlineacionColumna, ColumnaTabla, ValorTag } from './tabla.types';

/** Valores por defecto de formato (los de v1: `number: '1.2-2'` y `date: 'dd/MM/yyyy'`). */
export const DIGITOS_NUMERO = '1.0-2';
export const DIGITOS_MONEDA = '1.2-2';
export const FORMATO_FECHA_TABLA = 'dd/MM/yyyy';

/** Lee `ruta` (con punto) de `fila`. Devuelve `undefined` si algún tramo no existe. */
export function resolverCampo(fila: unknown, ruta: string): unknown {
  let actual: unknown = fila;
  for (const parte of ruta.split('.')) {
    if (actual === null || actual === undefined || typeof actual !== 'object') return undefined;
    actual = (actual as Record<string, unknown>)[parte];
  }
  return actual;
}

/** Identificador de la columna (`id` o, si no hay, `campo`). */
export function idColumna<T>(columna: ColumnaTabla<T>): string {
  return columna.id ?? columna.campo;
}

export function alineacionColumna<T>(columna: ColumnaTabla<T>): AlineacionColumna {
  if (columna.alineacion) return columna.alineacion;
  switch (columna.tipo) {
    case 'numero':
    case 'moneda':
      return 'derecha';
    case 'tag':
      return 'centro';
    default:
      return 'izquierda';
  }
}

const CLASE_ALINEACION: Record<AlineacionColumna, string> = {
  izquierda: 'text-left',
  centro: 'text-center',
  derecha: 'text-right',
};

export function claseAlineacion<T>(columna: ColumnaTabla<T>): string {
  return CLASE_ALINEACION[alineacionColumna(columna)];
}

function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Texto de un valor según el tipo de la columna. Sin `fila` (p. ej. en totales) una moneda
 * por fila se pinta sin símbolo. Valores vacíos → `''`.
 */
export function formatearValor<T>(
  valor: unknown,
  columna: ColumnaTabla<T>,
  locale: string,
  fila?: T,
): string {
  if (columna.formato && fila !== undefined) return columna.formato(valor, fila);
  if (valor === null || valor === undefined || valor === '') return '';

  switch (columna.tipo) {
    case 'numero': {
      const n = aNumero(valor);
      return n === null ? String(valor) : formatNumber(n, locale, columna.digitos ?? DIGITOS_NUMERO);
    }
    case 'moneda': {
      const n = aNumero(valor);
      if (n === null) return String(valor);
      const importe = formatNumber(n, locale, columna.digitos ?? DIGITOS_MONEDA);
      const simbolo =
        typeof columna.moneda === 'function'
          ? fila === undefined
            ? ''
            : columna.moneda(fila)
          : (columna.moneda ?? '');
      return simbolo ? `${simbolo} ${importe}` : importe;
    }
    case 'fecha': {
      if (!(valor instanceof Date) && typeof valor !== 'string' && typeof valor !== 'number') {
        return String(valor);
      }
      try {
        return formatDate(valor, columna.formatoFecha ?? FORMATO_FECHA_TABLA, locale);
      } catch {
        return String(valor);
      }
    }
    case 'tag': {
      const tag = fila === undefined ? null : columna.tag?.(valor, fila);
      return tag ? tag.texto : String(valor);
    }
    default:
      return String(valor);
  }
}

/** Texto de la celda de `columna` en `fila`. */
export function formatearCelda<T>(fila: T, columna: ColumnaTabla<T>, locale: string): string {
  return formatearValor(resolverCampo(fila, columna.campo), columna, locale, fila);
}

/** Tag de la celda (`null` si no hay valor ni función `tag` que lo resuelva). */
export function tagCelda<T>(fila: T, columna: ColumnaTabla<T>): ValorTag | null {
  const valor = resolverCampo(fila, columna.campo);
  if (columna.tag) return columna.tag(valor, fila);
  if (valor === null || valor === undefined || valor === '') return null;
  return { texto: String(valor) };
}
