import type { Cliente } from './cliente.model';

/** Clase (v1 hace `new Factoria()`); campos opcionales para que el JSON sea idéntico. */
export class Factoria {
  id?: number;
  refLarga1?: string;
  refLarga2?: string;
  codigo?: string;
  nombre?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  referencia?: string;
  estado?: number;
  cliente?: Cliente;
  ruc?: string;
  direccion?: string;
  tipo?: string;
}
