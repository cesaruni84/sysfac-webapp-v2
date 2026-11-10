import { Injectable } from '@angular/core';
import {
  FormaPago,
  Moneda,
  TipoDocPersona,
  TipoDocumento,
  TipoIGV,
  TipoItem,
  TipoOperacion,
  TiposEstadosDocumento,
  TiposGenericosDB,
} from '../../models';

/** Port de `TiposGenericosService` de v1: catálogos fijos compartiendo una única `TiposGenericosDB`. */
@Injectable({ providedIn: 'root' })
export class TiposGenericosService {
  readonly tiposGenericos = new TiposGenericosDB();

  retornarTiposDocumento(): TipoDocumento[] {
    return this.tiposGenericos.tiposDocumentoDB;
  }

  retornarTiposOperacion(): TipoOperacion[] {
    return this.tiposGenericos.tiposOperacionDB;
  }

  retornarFormasPago(): FormaPago[] {
    return this.tiposGenericos.formasPagoDB;
  }

  retornarMonedas(): Moneda[] {
    return this.tiposGenericos.monedaDB;
  }

  retornarTiposIGV(): TipoIGV[] {
    return this.tiposGenericos.tiposIgvDB;
  }

  retornarTiposItemFactura(): TipoItem[] {
    return this.tiposGenericos.tiposItemFactura;
  }

  retornarTiposDocPersona(): TipoDocPersona[] {
    return this.tiposGenericos.tipoDocumentoPersona;
  }

  retornarEstadosDocumento(): TiposEstadosDocumento[] {
    return this.tiposGenericos.tiposEstadoFactura;
  }
}
