import type { FechaApi } from './fecha';
import type { Cliente } from './cliente.model';
import type { Empresa } from './empresa.model';
import type { GuiaRemision } from './guia-remision.model';
import type { Liquidacion } from './liquidacion.model';
import type { Producto } from './producto.model';
import type { FormaPago, Moneda } from './tipos-facturacion';
import type { UnidadMedida } from './unidad-medida.model';

/** Clase (v1 hace `new Documento()`); campos opcionales. */
export class Documento {
  id?: number;
  tipoDocumento?: number;
  serie?: string;
  secuencia?: string;
  fechaEmision?: FechaApi;
  fechaVencimiento?: FechaApi;
  nroOrden?: string;
  estado?: number;
  observacion?: string;
  subTotalVentas?: number;
  anticipos?: number;
  descuentos?: number;
  ventaTotal?: number;
  isc?: number;
  igv?: number;
  otrosCargos?: number;
  otrosTributos?: number;
  totalDocumento?: number;
  tipoOperacion?: number;
  tipoAfectacion?: number;
  envioSunat?: number;
  fechaEnvioSunat?: FechaApi;
  estadoEnvioSunat?: number;
  observacionSunat?: string;
  file1Sunat?: string;
  file2Sunat?: string;
  file3Sunat?: string;
  notas?: string;
  usuarioRegistro?: string;
  usuarioActualiza?: string;
  cliente?: Cliente;
  empresa?: Empresa;
  formaPago?: FormaPago;
  moneda?: Moneda;
  documentoitemSet?: DocumentoItem[];
  liquidaciones?: Liquidacion[];
  guiasRemision?: GuiaRemision[];
}

/** Clase (v1 hace `new DocumentoItem()`); campos opcionales. */
export class DocumentoItem {
  id?: number;
  tipo?: number;
  codigo?: string;
  descripcion?: string;
  cantidad?: number;
  tarifa?: number;
  tipoDescuento?: number;
  factorDescuento?: number;
  descuentos?: number;
  subTotal?: number;
  tipoIGV?: number;
  valorIGV?: number;
  valorISC?: number;
  total?: number;
  productos?: Producto;
  unidadMedida?: UnidadMedida;
  guiasRemision?: GuiaRemision[];
  /** id de liquidación o guía de remisión */
  idRelated?: number;
}

export enum EstadoDocumento {
  REGISTRADO = 1,
  CANCELADO = 2,
  ANULADO = 3,
}

export enum TipoFactura {
  ITEM = '1',
  CON_LIQUIDACION = '2',
  CON_GUIAREMISION = '3',
}
