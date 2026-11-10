/** Clases (v1 hace `new Producto()` y `new Categoria()`); campos opcionales. */
export class Categoria {
  id?: number;
  nombre?: string;
}

export class Producto {
  id?: number;
  nemonico?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  fechaIngreso?: string;
  fechaActualizacion?: string;
  categoria?: Categoria;
  codigo?: string;
}
