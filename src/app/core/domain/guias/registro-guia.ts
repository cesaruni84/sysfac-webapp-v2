import {
  EstadoGuia,
  type Balanza,
  type Chofer,
  type Empresa,
  type Factoria,
  type GuiaDetalle,
  type GuiaRemision,
  type GuiaRemisionEnvio,
  type Producto,
  type UnidadMedida,
} from '../../models';
import { completarSecuencia, completarSerie } from '../../validators/formato';
import { ajustarFechaAnulacionGuia, ajustarFechaEnvioGuia, fechaLocalDesdeApiGuia } from './fechas-guia';

/** Motivo de traslado fijo que v1 envía en el alta y la edición de guías. */
export const MOTIVO_TRASLADO_GUIA = 2;

/** `codeMessage` con el que el backend avisa que la guía (propia o del cliente) ya existe. */
export const CODIGO_GUIA_EXISTENTE = 'GRT102';

/** Valores del formulario de registro de guías (los mismos campos que lee v1). */
export interface DatosFormularioGuia {
  serie: string;
  secuencia: string;
  /** Valor del combo de estado: `'0'` (Registrado) o `'1'` (Anulado), como en v1. */
  estado: string;
  serieCliente: string;
  secuenciaCliente: string;
  fechaEmision: Date | null;
  fechaIniTraslado: Date | null;
  fechaRecepcion: Date | null;
  remitente: Factoria | null;
  destinatario: Factoria | null;
  producto: Producto | null;
  cantidad: number | null;
  unidadMedida: UnidadMedida | null;
  balanza: Balanza | null;
  ticketBalanza: string | null;
  chofer: Chofer | null;
  placaTracto: string;
  placaBombona: string;
}

/** Datos que no vienen del formulario: sesión y lo recuperado de la guía consultada. */
export interface ContextoGuia {
  codigoUsuario: string;
  empresa: Empresa;
  /** Id de la guía cargada (`valorIdGuia_` de v1). */
  idGuia?: number;
  /** Id del detalle de la guía cargada (`valorIdGuiaDetalle_` de v1). */
  idGuiaDetalle?: number;
  /** Tarifa de la guía cargada; en una guía nueva v1 envía 0. */
  tarifa?: number;
  /** Liquidación y documento de la guía cargada: v1 reenvía solo su `id`. */
  liquidacion?: { id?: number } | null;
  documento?: { id?: number } | null;
}

/** Convierte `null` en `undefined` para que `JSON.stringify` omita la clave, como hacía v1. */
function opcional<T>(valor: T | null | undefined): T | undefined {
  return valor ?? undefined;
}

/**
 * Cuerpo del alta (POST `/guias`) o la edición (PUT `/guias/{id}`) de una guía
 * (`grabarGuiaRemision` de v1).
 *
 * Reglas de v1 que se conservan:
 * - Serie y secuencia del cliente se completan con ceros a 5 y 8 posiciones; las propias, solo en el alta.
 * - `totalCantidad` y `detalle.cantidad` son la cantidad digitada; `totalPeso` y `detalle.peso` van en 0.
 * - `motivoTraslado` es siempre 2 y `tarifa` es la de la guía cargada o 0.
 * - Las tres fechas se ajustan con `ajustarFechaEnvioGuia` (suma el desfase de zona horaria).
 * - `estado` viaja como string (valor del combo).
 * - `liquidacion`/`documento` solo con `id`, y solo si la guía cargada los tenía.
 * - En la edición el `id` va al final del objeto.
 * - El orden de las claves es el orden de asignación de v1 (para comparar el JSON a simple vista).
 */
export function construirGuiaRegistro(datos: DatosFormularioGuia, ctx: ContextoGuia, edicion: boolean): GuiaRemisionEnvio {
  const detalle: GuiaDetalle = {
    id: ctx.idGuiaDetalle,
    producto: opcional(datos.producto),
    cantidad: opcional(datos.cantidad),
    peso: 0,
    unidadMedida: opcional(datos.unidadMedida),
  };

  const guia: GuiaRemisionEnvio = {
    // v1 completa serie y secuencia propias solo en el alta; en la edición van tal cual.
    serie: edicion ? datos.serie : completarSerie(datos.serie),
    secuencia: edicion ? datos.secuencia : completarSecuencia(datos.secuencia),
    balanza: opcional(datos.balanza),
    totalCantidad: opcional(datos.cantidad),
    totalPeso: 0,
    motivoTraslado: MOTIVO_TRASLADO_GUIA,
    guiaDetalle: [detalle],
    tarifa: ctx.tarifa || 0,
    ticketBalanza: opcional(datos.ticketBalanza),
    placaTracto: datos.placaTracto,
    placaBombona: datos.placaBombona,
    serieCliente: completarSerie(datos.serieCliente),
    secuenciaCliente: completarSecuencia(datos.secuenciaCliente),
    usuarioRegistro: ctx.codigoUsuario,
    usuarioActualiza: ctx.codigoUsuario,
    estado: datos.estado,
    fechaRemision: ajustarFechaEnvioGuia(datos.fechaEmision),
    fechaTraslado: ajustarFechaEnvioGuia(datos.fechaIniTraslado),
    fechaRecepcion: ajustarFechaEnvioGuia(datos.fechaRecepcion),
    remitente: opcional(datos.remitente),
    destinatario: opcional(datos.destinatario),
    empresa: ctx.empresa,
    chofer: opcional(datos.chofer),
  };

  if (ctx.liquidacion) guia.liquidacion = { id: ctx.liquidacion.id };
  if (ctx.documento) guia.documento = { id: ctx.documento.id };
  if (edicion) guia.id = ctx.idGuia;
  return guia;
}

/**
 * Cuerpo de la anulación (PUT `/guias/0/extorno`), como `anularGuiaRemision` de v1.
 *
 * - Serie y secuencia van tal como están en el formulario (v1 no las completa aquí).
 * - `estado` es el número `EstadoGuia.ANULADO`.
 * - Fechas: si hay, se ajustan como en el alta; si no, fecha y hora actuales sin ajuste.
 * - Placas y ticket vacíos se envían como `'?'`; cantidad vacía como 0.
 * - El detalle solo se envía si la guía tiene `id` (si no, `guiaDetalle: []`).
 * - No envía `motivoTraslado`, `liquidacion` ni `documento`.
 */
export function construirGuiaAnulacion(datos: DatosFormularioGuia, ctx: ContextoGuia, ahora: Date = new Date()): GuiaRemisionEnvio {
  const guia: GuiaRemisionEnvio = {
    id: ctx.idGuia,
    serie: datos.serie,
    secuencia: datos.secuencia,
    serieCliente: datos.serieCliente || '',
    secuenciaCliente: datos.secuenciaCliente || '',
    estado: EstadoGuia.ANULADO,
    remitente: opcional(datos.remitente),
    destinatario: opcional(datos.destinatario),
    chofer: opcional(datos.chofer),
    fechaRemision: ajustarFechaAnulacionGuia(datos.fechaEmision, ahora),
    fechaTraslado: ajustarFechaAnulacionGuia(datos.fechaIniTraslado, ahora),
    fechaRecepcion: ajustarFechaAnulacionGuia(datos.fechaRecepcion, ahora),
    placaBombona: datos.placaBombona || '?',
    placaTracto: datos.placaTracto || '?',
    ticketBalanza: datos.ticketBalanza || '?',
    balanza: opcional(datos.balanza),
    totalCantidad: datos.cantidad || 0,
    totalPeso: 0,
    tarifa: ctx.tarifa || 0,
  };

  guia.guiaDetalle = ctx.idGuia
    ? [
        {
          id: ctx.idGuiaDetalle,
          producto: opcional(datos.producto),
          cantidad: datos.cantidad || 0,
          peso: 0,
          unidadMedida: opcional(datos.unidadMedida),
        },
      ]
    : [];
  guia.empresa = ctx.empresa;
  guia.usuarioRegistro = ctx.codigoUsuario;
  guia.usuarioActualiza = ctx.codigoUsuario;
  return guia;
}

/** Guía recuperada del backend, preparada para el formulario (`parsearDatosGuiaRemision` de v1). */
export interface GuiaCargada {
  idGuia: number;
  /** Estado como string para el combo (`estado.toString()` de v1). */
  estado: string;
  fechaEmision: Date | null;
  fechaIniTraslado: Date | null;
  fechaRecepcion: Date | null;
  serie: string;
  secuencia: string;
  /** Solo si la guía trae remitente; RUC y dirección salen de `remitente.cliente`. */
  remitente?: { factoria: Factoria; ruc: string; direccion: string };
  destinatario?: { factoria: Factoria; ruc: string; direccion: string };
  /** Solo si la guía trae detalle: id, producto y unidad del primer detalle. */
  detalle?: { id?: number; producto: Producto | null; unidadMedida: UnidadMedida | null };
  cantidad: number | null;
  placaTracto: string;
  placaBombona: string;
  /** Solo si la guía trae chofer; certificado y licencia salen del chofer. */
  chofer?: { chofer: Chofer; certificado: string; licencia: string };
  /** Solo si la guía trae balanza. */
  balanza?: Balanza;
  ticketBalanza: string;
  serieCliente: string;
  secuenciaCliente: string;
  anulada: boolean;
  liquidacion?: { id?: number };
  documento?: { id?: number };
  tarifa?: number;
}

/**
 * Prepara una guía del backend para el formulario, como `parsearDatosGuiaRemision` de v1.
 * Los bloques opcionales (`remitente`, `detalle`, `chofer`, `balanza`...) solo vienen si la guía
 * los trae: la pantalla conserva lo que ya tenía en los que faltan, igual que v1.
 */
export function cargarGuiaEnFormulario(guia: GuiaRemision): GuiaCargada {
  const primerDetalle = guia.guiaDetalle?.[0];
  const cargada: GuiaCargada = {
    idGuia: guia.id || 0,
    estado: String(guia.estado ?? ''),
    fechaEmision: fechaLocalDesdeApiGuia(guia.fechaRemision),
    fechaIniTraslado: fechaLocalDesdeApiGuia(guia.fechaTraslado),
    fechaRecepcion: fechaLocalDesdeApiGuia(guia.fechaRecepcion),
    serie: guia.serie ?? '',
    secuencia: guia.secuencia ?? '',
    cantidad: guia.totalCantidad ?? null,
    placaTracto: guia.placaTracto ?? '',
    placaBombona: guia.placaBombona ?? '',
    ticketBalanza: guia.ticketBalanza || '',
    serieCliente: guia.serieCliente || '',
    secuenciaCliente: guia.secuenciaCliente || '',
    anulada: guia.estado === EstadoGuia.ANULADO,
    liquidacion: opcional(guia.liquidacion),
    documento: opcional(guia.documento),
    tarifa: opcional(guia.tarifa),
  };
  if (guia.remitente) {
    cargada.remitente = {
      factoria: guia.remitente,
      ruc: guia.remitente.cliente?.ruc ?? '',
      direccion: guia.remitente.cliente?.direccion ?? '',
    };
  }
  if (guia.destinatario) {
    cargada.destinatario = {
      factoria: guia.destinatario,
      ruc: guia.destinatario.cliente?.ruc ?? '',
      direccion: guia.destinatario.cliente?.direccion ?? '',
    };
  }
  if (primerDetalle) {
    cargada.detalle = {
      id: primerDetalle.id,
      producto: primerDetalle.producto ?? null,
      unidadMedida: primerDetalle.unidadMedida ?? null,
    };
  }
  if (guia.chofer) {
    cargada.chofer = {
      chofer: guia.chofer,
      certificado: guia.chofer.certificado ?? '',
      licencia: guia.chofer.licencia ?? '',
    };
  }
  if (guia.balanza) cargada.balanza = guia.balanza;
  return cargada;
}

/**
 * Datos que v1 copia al elegir un chofer (`seleccionarChofer`): certificado y licencia del chofer,
 * y placas de su vehículo. Si el chofer no tiene vehículo, las placas no se tocan (`undefined`).
 */
export function datosDeChofer(chofer: Chofer): {
  certificado: string;
  licencia: string;
  placaTracto?: string;
  placaBombona?: string;
} {
  return {
    certificado: chofer.certificado ?? '',
    licencia: chofer.licencia ?? '',
    placaTracto: chofer.vehiculo ? (chofer.vehiculo.placaTracto ?? '') : undefined,
    placaBombona: chofer.vehiculo ? (chofer.vehiculo.placaBombona ?? '') : undefined,
  };
}

/**
 * La pantalla entra en modo consulta/edición si llegan `_serie` y `_secuencia` en la URL
 * (`validarGrabarActualizar` de v1).
 */
export function esConsultaPorUrl(serie: string | null, secuencia: string | null): boolean {
  return !!serie && !!secuencia;
}
