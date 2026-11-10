import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TiposGenericosDB } from '../../models';
import { TiposGenericosService } from './tipos-genericos.service';
import { UbigeosService } from './ubigeos.service';

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

describe('UbigeosService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  it('GET ./assets/ubigeo-reniec.json', () => {
    TestBed.inject(UbigeosService).cargarUbigeos().subscribe();
    const req = http.expectOne('./assets/ubigeo-reniec.json');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    http.verify();
  });
});
