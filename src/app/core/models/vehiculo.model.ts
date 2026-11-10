/** Clase (v1 hace `new Vehiculo()`); campos opcionales para que el JSON sea idéntico. */
export class Vehiculo {
  id?: number;
  placaTracto?: string;
  placaBombona?: string;
  licencia?: string;
  estado?: number;
  modelo?: string;
  garantia?: string;
  fechaRegistro?: string;
  fechaActualiza?: string;
}
