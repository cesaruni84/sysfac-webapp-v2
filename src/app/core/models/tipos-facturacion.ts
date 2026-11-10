export class TipoGenerico {
  id?: number;
  codigo?: string;
  descripcion?: string;
  nemonico?: string;
}

export interface CargaDB {
  cargaDB(): void;
}

export class TipoDocumento extends TipoGenerico {}
export class TipoOperacion extends TipoGenerico {}
export class FormaPago extends TipoGenerico {}
export class Moneda extends TipoGenerico {}
export class TipoIGV extends TipoGenerico {}
export class TipoItem extends TipoGenerico {}
export class TipoDocPersona extends TipoGenerico {}
export class TiposEstadosDocumento extends TipoGenerico {}
