import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { GuiaRemision } from '../../models';
import { GuiaRemisionService } from './guia-remision.service';

describe('GuiaRemisionService (contrato v1)', () => {
  const api = environment.apiUrl;
  const guia: GuiaRemision = { id: 7 };
  let service: GuiaRemisionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GuiaRemisionService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function esperar(url: string, method: string) {
    const req = http.expectOne((r) => r.url === url && r.method === method);
    return req;
  }

  it('listarGrillaGuias: GET empresas/{id}/guias/SRV1', () => {
    service.listarGrillaGuias(1).subscribe();
    esperar(`${api}/empresas/1/guias/SRV1`, 'GET').flush([]);
  });

  it('listarGuiasConFiltros: GET SRV2 con todos los params', () => {
    service.listarGuiasConFiltros(1, 'T001', '12', 2, 3, 4, 5, true, 6, '2020-01-01', '2020-01-31').subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV2`, 'GET');
    expect(req.request.params.keys().sort()).toEqual(
      ['chofer', 'conFormateo', 'destino', 'estado', 'fechaFin', 'fechaIni', 'nroSecuencia', 'nroSerie', 'origen', 'tipoBusqueda'],
    );
    expect(req.request.params.get('nroSerie')).toBe('T001');
    expect(req.request.params.get('chofer')).toBe('3');
    expect(req.request.params.get('origen')).toBe('4');
    expect(req.request.params.get('destino')).toBe('5');
    expect(req.request.params.get('estado')).toBe('2');
    expect(req.request.params.get('conFormateo')).toBe('true');
    expect(req.request.params.get('tipoBusqueda')).toBe('6');
    req.flush([]);
  });

  it('listarGuiasPorGuiaCliente: GET SRV6 con nroSerieCli/nroSecuenciaCli', () => {
    service.listarGuiasPorGuiaCliente(1, 'S', 'N', 2, 3, 4, 5, false, 6, 'a', 'b').subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV6`, 'GET');
    expect(req.request.params.get('nroSerieCli')).toBe('S');
    expect(req.request.params.get('nroSecuenciaCli')).toBe('N');
    expect(req.request.params.get('conFormateo')).toBe('false');
    expect(req.request.params.keys().length).toBe(10);
    req.flush([]);
  });

  it('listarGuiasConFiltrosCache: GET SRV2 con 7 params', () => {
    service.listarGuiasConFiltrosCache(1, 'S', 'N', 2, 3, 5, 'a', 'b').subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV2`, 'GET');
    expect(req.request.params.keys().sort()).toEqual(
      ['chofer', 'destino', 'estado', 'fechaFin', 'fechaIni', 'nroSecuencia', 'nroSerie'],
    );
    req.flush([]);
  });

  it('obtenerGuiaRemision: GET SRV3 sin params', () => {
    service.obtenerGuiaRemision(1).subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV3`, 'GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush([]);
  });

  it('registrarGuiaRemisionBD: POST guias con cuerpo', () => {
    service.registrarGuiaRemisionBD(guia).subscribe();
    const req = esperar(`${api}/guias`, 'POST');
    expect(req.request.body).toBe(guia);
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({});
  });

  it('actualizarGuiaRemisionBD: PUT guias/{id}', () => {
    service.actualizarGuiaRemisionBD(guia).subscribe();
    const req = esperar(`${api}/guias/7`, 'PUT');
    expect(req.request.body).toBe(guia);
    req.flush({});
  });

  it('actualizarTarifaGuiaRemision: PUT guias/{id}/tarifa', () => {
    service.actualizarTarifaGuiaRemision(guia).subscribe();
    esperar(`${api}/guias/7/tarifa`, 'PUT').flush({});
  });

  it('anularGuiaRemisionBD: PUT guias/0/extorno', () => {
    service.anularGuiaRemisionBD(guia).subscribe();
    const req = esperar(`${api}/guias/0/extorno`, 'PUT');
    expect(req.request.body).toBe(guia);
    req.flush({});
  });

  it('actualizarGuiaRemisionLiquidacion: PUT liquidaciones/{liq}/guias/{id}', () => {
    service.actualizarGuiaRemisionLiquidacion(guia, 9).subscribe();
    const req = esperar(`${api}/liquidaciones/9/guias/7`, 'PUT');
    expect(req.request.body).toBe(guia);
    req.flush({});
  });

  it('obtenerGuiaRemisionxNroGuia: GET SRV3 con nroSerie/nroSecuencia', () => {
    service.obtenerGuiaRemisionxNroGuia(1, 'S', 'N').subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV3`, 'GET');
    expect(req.request.params.get('nroSerie')).toBe('S');
    expect(req.request.params.get('nroSecuencia')).toBe('N');
    req.flush({});
  });

  it('buscaGuiaRemisionxNroGuia: GET SRV5', () => {
    service.buscaGuiaRemisionxNroGuia(1, 'S', 'N').subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV5`, 'GET');
    expect(req.request.params.keys().sort()).toEqual(['nroSecuencia', 'nroSerie']);
    req.flush({});
  });

  it('obtenerGuiaRemisionxNroGuiaCliente: GET guia-cliente/SRV3 (singular)', () => {
    service.obtenerGuiaRemisionxNroGuiaCliente(1, 'S', 'N').subscribe();
    const req = esperar(`${api}/empresas/1/guia-cliente/SRV3`, 'GET');
    expect(req.request.params.keys().sort()).toEqual(['nroSecuenciaCli', 'nroSerieCli']);
    req.flush({});
  });

  it('buscaGuiaRemisionxNroGuiaCliente: GET guias-cliente/SRV5 (plural)', () => {
    service.buscaGuiaRemisionxNroGuiaCliente(1, 'S', 'N').subscribe();
    const req = esperar(`${api}/empresas/1/guias-cliente/SRV5`, 'GET');
    expect(req.request.params.keys().sort()).toEqual(['nroSecuencia', 'nroSerie']);
    req.flush({});
  });

  it('listarGuiasRemisionPorLiquidar: GET SRV0', () => {
    service.listarGuiasRemisionPorLiquidar(1, 2, 3, 'a', 'b').subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV0`, 'GET');
    expect(req.request.params.keys().sort()).toEqual(['destino', 'fechaFin', 'fechaIni', 'origen']);
    expect(req.request.params.get('origen')).toBe('2');
    expect(req.request.params.get('destino')).toBe('3');
    req.flush([]);
  });

  it('listarGuiasRemisionPorFacturar: GET SRV4', () => {
    service.listarGuiasRemisionPorFacturar(1, 2, 3, 'a', 'b').subscribe();
    const req = esperar(`${api}/empresas/1/guias/SRV4`, 'GET');
    expect(req.request.params.keys().sort()).toEqual(['destino', 'fechaFin', 'fechaIni', 'origen']);
    req.flush([]);
  });

  it('eliminarGuiaBD: DELETE empresas/{id}/guias/{serie}/{secuencia}', () => {
    service.eliminarGuiaBD('T001', '12', 1).subscribe();
    esperar(`${api}/empresas/1/guias/T001/12`, 'DELETE').flush({});
  });
});
