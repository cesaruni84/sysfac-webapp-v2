import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TiposGenericosDB } from '../../models';
import { TiposGenericosService } from './tipos-genericos.service';

describe('TiposGenericosService', () => {
  it('devuelve los catálogos de una única TiposGenericosDB', () => {
    TestBed.configureTestingModule({});
    const s = TestBed.inject(TiposGenericosService);
    const db: TiposGenericosDB = s.tiposGenericos;
    expect(s.retornarTiposDocumento()).toBe(db.tiposDocumentoDB);
    expect(s.retornarTiposOperacion()).toBe(db.tiposOperacionDB);
    expect(s.retornarFormasPago()).toBe(db.formasPagoDB);
    expect(s.retornarMonedas()).toBe(db.monedaDB);
    expect(s.retornarTiposIGV()).toBe(db.tiposIgvDB);
    expect(s.retornarTiposItemFactura()).toBe(db.tiposItemFactura);
    expect(s.retornarTiposDocPersona()).toBe(db.tipoDocumentoPersona);
    expect(s.retornarEstadosDocumento()).toBe(db.tiposEstadoFactura);
    expect(s.retornarTiposDocumento().length).toBeGreaterThan(0);
    expect(TestBed.inject(TiposGenericosService)).toBe(s);
  });
});
