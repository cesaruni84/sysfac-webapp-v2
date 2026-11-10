import { UnidadMedida } from './unidad-medida.model';

/**
 * Elemento del combo "productos-servicios" (`listarComboProductosServicios`, SRV1).
 * v1 lo tipa `any[]`; los campos son los que lee
 * `factura-item.component.ts` (líneas 117 y 126-132): `descripcion`, `tipo.id`, `codigo`,
 * `unidadMedida`, `tarifa`, y `id` (compareObjects2, línea 144).
 */
export interface ProductoServicio {
  id?: number;
  codigo?: string;
  descripcion?: string;
  tipo?: { id: number };
  unidadMedida?: UnidadMedida;
  tarifa?: number;
}
