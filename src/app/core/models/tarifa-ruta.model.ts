import type { FechaApi } from './fecha';
import type { Empresa } from './empresa.model';
import type { Factoria } from './factoria.model';

/** Clase (v1 hace `new Turno()`); campos opcionales. */
export class Turno {
  id?: number;
  nombreturno?: string;
  horainicio?: string;
  horafin?: string;
}

/** Clase (v1 hace `new TarifaRuta()`); campos opcionales. */
export class TarifaRuta {
  id?: number;
  notas?: string;
  importe?: number;
  fechaRegistro?: FechaApi;
  fechaActualiza?: FechaApi;
  estado?: number;
  moneda?: number;
  origen?: Factoria;
  destino?: Factoria;
  empresa?: Empresa;
  turno?: Turno;
}
