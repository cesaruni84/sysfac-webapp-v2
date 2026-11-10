import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { ClienteService } from './cliente.service';
import { ItemFacturaService } from './item-factura.service';

describe('Servicios de facturación (contrato v1)', () => {
  const api = environment.apiUrl;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('ClienteService: listar, registrar, actualizar', () => {
    const s = TestBed.inject(ClienteService);
    const cli = { id: 3 };

    s.listarClientesPorEmpresa(1).subscribe();
    const get = http.expectOne(`${api}/empresas/1/clientes`);
    expect(get.request.method).toBe('GET');
    get.flush([]);

    s.registrarCliente(cli).subscribe();
    const post = http.expectOne(`${api}/empresas/clientes`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toBe(cli);
    post.flush({});

    s.actualizarCliente(cli).subscribe();
    const put = http.expectOne(`${api}/empresas/clientes/3`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toBe(cli);
    put.flush({});
  });

  it('ItemFacturaService: escrituras de documentos', () => {
    const s = TestBed.inject(ItemFacturaService);
    const doc = { id: 5 };

    s.listarItemsParaFactura(1, 2).subscribe();
    const items = http.expectOne(`${api}/empresas/1/clientes`);
    expect(items.request.method).toBe('GET');
    items.flush([]);

    s.registrarDocumentoElectronico(doc, 1).subscribe();
    const post = http.expectOne(`${api}/empresas/1/documentos`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toBe(doc);
    post.flush({});

    const puts: [() => void, string][] = [
      [() => s.actualizarDocumentoElectronico(doc, 1).subscribe(), `${api}/empresas/1/documentos/5`],
      [() => s.anularDocumentoElectronico(doc, 1).subscribe(), `${api}/empresas/1/documentos/5/extorno`],
      [() => s.cancelarDocumentoElectronico(doc, 1).subscribe(), `${api}/empresas/1/documentos/5/cancelacion`],
    ];
    for (const [call, url] of puts) {
      call();
      const req = http.expectOne(url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBe(doc);
      req.flush({});
    }
  });

  it('ItemFacturaService: consultas de documentos', () => {
    const s = TestBed.inject(ItemFacturaService);

    s.listarDocumentosPorFiltro(1, 'F001', '10', 2, 3, 4, 'a', 'b').subscribe();
    const srv2 = http.expectOne((r) => r.url === `${api}/empresas/1/documentos/SRV2`);
    expect(srv2.request.method).toBe('GET');
    expect(srv2.request.params.keys().sort()).toEqual(
      ['cliente', 'estado', 'fechaFin', 'fechaIni', 'nroSecuencia', 'nroSerie', 'tipoDocumento'],
    );
    expect(srv2.request.params.get('cliente')).toBe('3');
    expect(srv2.request.params.get('estado')).toBe('4');
    expect(srv2.request.params.get('tipoDocumento')).toBe('2');
    srv2.flush([]);

    s.listarDocumentosConErrores(1, '01', 'a', 'b').subscribe();
    const err = http.expectOne((r) => r.url === `${api}/empresas/1/documentos/error`);
    expect(err.request.params.keys().sort()).toEqual(['fechaFin', 'fechaIni', 'subTipoDocumento']);
    err.flush([]);

    s.obtenerDocumentPorSerie(1, 2, 'F001', '10').subscribe();
    const srv1 = http.expectOne((r) => r.url === `${api}/empresas/1/documentos/SRV1`);
    expect(srv1.request.params.keys().sort()).toEqual(['nroSecuencia', 'nroSerie', 'tipoDocumento']);
    srv1.flush({});

    s.validarDocumentPorSerie(1, 2, 'F001', '10').subscribe();
    const srv5 = http.expectOne((r) => r.url === `${api}/empresas/1/documentos/SRV5`);
    expect(srv5.request.params.keys().sort()).toEqual(['nroSecuencia', 'nroSerie', 'tipoDocumento']);
    srv5.flush({});
  });
});
