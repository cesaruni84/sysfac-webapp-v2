import type { Cliente } from './cliente.model';
import type { Empresa } from './empresa.model';
import type { Liquidacion } from './liquidacion.model';
import type { FormaPago, Moneda } from './tipos-facturacion';

/** Clase (v1 hace `new OrdenServicio()`); campos opcionales. */
export class OrdenServicio {
  id?: number;
  tipocod?: string;
  nroOrden?: string;
  situacion?: number;
  estado?: number;
  fechaOrden?: Date;
  fechaVencimiento?: Date;
  fechaAprobacion?: Date;
  lugarEntrega?: string;
  instrucciones?: string;
  glosa?: string;
  subTotal?: number;
  totalCantidad?: number;
  descuentos?: number;
  valorCompra?: number;
  igvAplicado?: number;
  importeTotal?: number;
  usuarioRegistro?: string;
  usuarioActualiza?: string;
  fechaRegistro?: Date;
  fechaActualiza?: Date;
  formaPago?: FormaPago;
  cliente?: Cliente;
  empresa?: Empresa;
  moneda?: Moneda;
  liquidaciones?: Liquidacion[];
}
