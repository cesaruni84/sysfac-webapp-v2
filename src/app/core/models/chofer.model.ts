import type { Empresa } from './empresa.model';
import type { Vehiculo } from './vehiculo.model';

/**
 * Clase (v1 hace `new Chofer()`). `certificado` y `licencia` eran `any` en v1:
 * se tipan como `unknown` (no tienen forma conocida).
 */
export class Chofer {
  id?: number;
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  fechaRegistro?: string;
  fechaActualiza?: string;
  certificado?: unknown;
  licencia?: unknown;
  empresa?: Empresa;
  vehiculo?: Vehiculo;
}
