import type { Empresa } from './empresa.model';

/** Interface: v1 nunca la instancia con `new`. */
export interface Usuario {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  cargo: string;
  fechaAlta: string;
  empresa: Empresa;
}
