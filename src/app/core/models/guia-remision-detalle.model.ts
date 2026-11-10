import type { Producto } from './producto.model';
import type { UnidadMedida } from './unidad-medida.model';

/** Clase (v1 hace `new GuiaDetalle()`); campos opcionales. */
export class GuiaDetalle {
  id?: number;
  cantidad?: number;
  peso?: number;
  producto?: Producto;
  unidadMedida?: UnidadMedida;
}
