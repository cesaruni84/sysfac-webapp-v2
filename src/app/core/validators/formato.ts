/** Longitudes exactas usadas en v1 al completar con ceros. */
export const LONGITUD_SERIE = 5;
export const LONGITUD_SECUENCIA = 8;
export const LONGITUD_NRO_DOC = 12;

type Entrada = string | number | null | undefined;

/**
 * Solo digitos: elimina todo caracter que no sea 0-9. Reemplaza el filtro de
 * teclado `validaDigitos` de v1, aplicandolo tambien a texto pegado.
 *
 * Diferencia intencionada: en el evento `keypress` de v1, `keyCode 46` es el
 * caracter `.` (no Supr), asi que v1 permitia escribir puntos (que `digits` luego
 * marcaba como error; en `ruc` de `cliente-popup` y `numeroDocumento` de `wizard`,
 * sin `digits`, podian grabarse). v2 es mas estricto: solo digitos.
 */
export function soloDigitos(valor: Entrada): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/\D/g, '');
}

/**
 * Completa con ceros a la izquierda hasta `longitud` (`pad` de v1). No trunca si
 * el valor ya es mas largo. Una cadena vacia se devuelve vacia.
 *
 * Todas las pantallas de v1 completan solo si hay texto, EXCEPTO
 * `factura-pop-up.component.ts:145-150` (sin guarda): si el usuario borra el campo,
 * v1 envia `000000000000` como `nroDocLiq` en `buscarLiquidacionesPorFacturar`.
 * En v2 `completarCeros('')` devuelve `''` intencionadamente y la pantalla 4.12
 * decide que enviar.
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
