import type { Balanza } from './balanza.model';
import type { Chofer } from './chofer.model';
import type { Empresa } from './empresa.model';
import type { Documento } from './facturacion.model';
import type { Factoria } from './factoria.model';
import type { GuiaDetalle } from './guia-remision-detalle.model';
import type { Liquidacion } from './liquidacion.model';

/**
 * Clase (v1 hace `new GuiaRemision()`); campos opcionales.
 * `liquidacion` era `any` en v1: se tipa como `Liquidacion`.
 */
export class GuiaRemision {
  id?: number;
  serie?: string;
  secuencia?: string;
  totalCantidad?: number;
  totalPeso?: number;
  estado?: number;
  motivoTraslado?: number;
  tarifa?: number;
  subTotal?: number;
  fechaRemision?: Date;
  fechaTraslado?: Date;
  fechaRecepcion?: Date;
  ticketBalanza?: string;
  serieCliente?: string;
  secuenciaCliente?: string;
  fechaRegistro?: Date;
  fechaActualiza?: Date;
  usuarioRegistro?: string;
  usuarioActualiza?: string;
  placaTracto?: string;
  placaBombona?: string;
  guiaDetalle?: GuiaDetalle[];
  balanza?: Balanza;
  remitente?: Factoria;
  destinatario?: Factoria;
  liquidacion?: Liquidacion;
  documento?: Documento;
  empresa?: Empresa;
  chofer?: Chofer;
  idOrigen?: string;
  idDestino?: string;
  idProducto?: string;
}

export enum EstadoGuia {
  REGISTRADO = 0,
  ANULADO = 1,
}

export enum TipoBusquedaGuias {
  TODOS = 0,
  GUIAS_FACTURADAS = 1,
  GUIAS_NO_FACTURADAS = 2,
}

export interface GrillaGuiaRemision {
  id: number;
  nroguia: string;
  nroSecuencia: string;
  fechaEmision: string;
  usuarioRegistra: string;
  nroLiq: string;
  ordenServicio: string;
  remitente: string;
  destinatario: string;
  estado: string;
  producto: string;
  cantidad: string;
  chofer: string;
  nroGuiaCliente: string;
  fechaRecepcion: string;
}

export interface GuiaRemisionReportExcel {
  id?: number;
  nroguia?: string;
  nroSecuencia?: string;
  fechaEmision?: Date;
  usuarioRegistra?: string;
  nroLiq?: string;
  ordenServicio?: string;
  remitente?: string;
  destinatario?: string;
  estado?: string;
  producto?: string;
  cantidad?: string;
  chofer?: string;
  nroGuiaCliente?: string;
  factura?: string;
  fechaRecepcion?: string;
  estadoFactura?: string;
}

/** Clase (v1 hace `new GuiasRemisionPDF()`); campos opcionales. */
export class GuiasRemisionPDF {
  id?: number;
  fechaTraslado?: string;
  guiaRemision?: string;
  guiaCliente?: string;
  descripcion?: string;
  ticketBalanza?: string;
  unidadMedida?: string;
  cantidad?: string;
  tarifa?: string;
  subTotal?: string;
}
