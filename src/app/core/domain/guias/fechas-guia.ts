import type { FechaApi } from '../../models';

const MS_POR_MINUTO = 60 * 1000;

/** Suma a la fecha su propio desfase de zona horaria (`getTimezoneOffset`), como v1. */
function sumarDesfase(fecha: Date): Date {
  fecha.setTime(fecha.getTime() + fecha.getTimezoneOffset() * MS_POR_MINUTO);
  return fecha;
}

/**
 * Fecha de la guía tal como v1 la envía al backend en el alta y la edición
 * (`grabarGuiaRemision` de `basic-form`): `new Date(valor)` y luego **suma** el desfase de la zona
 * horaria del navegador.
 *
 * Ejemplo en Lima (UTC-5, desfase +300 min): el datepicker entrega el 15/01/2024 a las 00:00 locales
 * (`2024-01-15T05:00:00.000Z`) y se envía `2024-01-15T10:00:00.000Z`.
 *
 * `null` se trata como `new Date(null)` de v1 (época Unix) para que el JSON sea idéntico.
 * No muta la fecha recibida.
 */
export function ajustarFechaEnvioGuia(fecha: Date | string | null): Date {
  return sumarDesfase(new Date(fecha ?? 0));
}

/**
 * Fecha de la guía en la anulación (`anularGuiaRemision` de v1): si hay fecha se ajusta igual que
 * en el alta; si no, v1 envía la fecha y hora actuales **sin** ajuste.
 */
export function ajustarFechaAnulacionGuia(fecha: Date | string | null, ahora: Date = new Date()): Date {
  return fecha ? ajustarFechaEnvioGuia(fecha) : ahora;
}

/**
 * Fecha recibida del backend lista para el datepicker (`calcularFechaHoraLocal` de v1):
 * `new Date(valor.toString())` y luego **suma** el desfase de zona horaria.
 * Sin fecha devuelve `null` (v1 devolvía `undefined`).
 */
export function fechaLocalDesdeApiGuia(fecha: FechaApi | null | undefined): Date | null {
  if (!fecha) return null;
  return sumarDesfase(new Date(fecha.toString()));
}
