/** Clase (v1 hace `new Cliente()`); campos opcionales para que el JSON sea idéntico. */
export class Cliente {
  id?: number;
  razonSocial?: string;
  ruc?: string;
  nombreComercial?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  fechaRegistro?: string;
  tipoDoc?: number;
}
