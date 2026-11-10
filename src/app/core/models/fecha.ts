/**
 * Fecha tal como la maneja el contrato con el backend.
 *
 * En las respuestas del backend las fechas llegan como string ISO (JSON no tiene
 * tipo fecha); en los envíos se puede mandar un `Date` (se serializa a ISO con
 * `JSON.stringify`). Antes de operar con una fecha recibida (comparar, formatear,
 * calcular) conviértela con `new Date(valor)`.
 */
export type FechaApi = Date | string;
