import type { FechaApi } from './fecha';
import type { Documento } from './facturacion.model';
import type { Factoria } from './factoria.model';
import type { GuiaRemision } from './guia-remision.model';
import type { MotivoTraslado } from './motivo-traslado.model';
import type { OrdenServicio } from './orden-servicio.model';

/** Clase (v1 hace `new Liquidacion()`); campos opcionales. Se conserva `IGV` en mayúsculas. */
export class Liquidacion {
  id?: number;
  tipocod?: string;
  nrodoc?: string;
  fechaEmision?: FechaApi;
  estado?: number;
  situacion?: number;
  fecIniTraslado?: FechaApi;
  fecFinTraslado?: FechaApi;
  glosa?: string;
  moneda?: number;
  totalCantidad?: number;
  subTotalLiq?: number;
  IGV?: number;
  importeTotal?: number;
  usuarioRegistro?: string;
  usuarioActualiza?: string;
  motivo?: MotivoTraslado;
  origen?: Factoria;
  destino?: Factoria;
  guias?: GuiaRemision[];
  ordenServicio?: OrdenServicio;
  notas1?: string;
  notas2?: string;
  documento?: Documento;
}

export interface LiquidacionReportExcel {
  item: number;
  nrodoc: string;
  fechaEmision: string;
  ordenServicio: string;
  origen: string;
  destino: string;
  estado: string;
  importeTotal: number;
}

export enum TipoBusquedaLiq {
  TODOS = 0,
  LIQ_FACTURADAS = 1,
  LIQ_NO_FACTURADAS = 2,
}

export enum EstadoLiquidacion {
  TODOS = 0,
  VIGENTE = 1,
  VENCIDO = 2,
}
