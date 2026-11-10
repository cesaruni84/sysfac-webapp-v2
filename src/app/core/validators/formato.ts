/** Longitudes exactas usadas en v1 al completar con ceros. */
export const LONGITUD_SERIE = 5;
export const LONGITUD_SECUENCIA = 8;
export const LONGITUD_NRO_DOC = 12;

type Entrada = string | number | null | undefined;

/**
 * Solo digitos: elimina todo caracter que no sea 0-9. Reemplaza el filtro de
 * teclado `validaDigitos` de v1 (que solo dejaba pasar teclas 48-57, Backspace y
 * Supr) aplicandolo tambien a texto pegado.
 */
export function soloDigitos(valor: Entrada): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/\D/g, '');
}

/**
 * Completa con ceros a la izquierda hasta `longitud` (`pad` de v1). No trunca si
 * el valor ya es mas largo. Igual que v1 (`valor.toLowerCase()`), una cadena vacia
 * se devuelve vacia (los manejadores de v1 solo completan si hay texto).
 */
export function completarCeros(valor: Entrada, longitud: number): string {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor).toLowerCase();
  if (texto === '') return '';
  return texto.padStart(longitud, '0');
}

/** Serie de guia/comprobante: 5 posiciones (`completarZerosNroSerie*`). */
export const completarSerie = (valor: Entrada): string => completarCeros(valor, LONGITUD_SERIE);

/** Secuencia de guia/comprobante: 8 posiciones (`completarZerosNroSecuencia*`). */
export const completarSecuencia = (valor: Entrada): string =>
  completarCeros(valor, LONGITUD_SECUENCIA);

/** Numero de documento/liquidacion: 12 posiciones (`completarZerosNroDoc`, `...SerieLiq`). */
export const completarNroDoc = (valor: Entrada): string => completarCeros(valor, LONGITUD_NRO_DOC);
