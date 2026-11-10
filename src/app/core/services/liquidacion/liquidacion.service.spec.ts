import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Documento } from '../../models';
import { ImpuestoService } from './impuesto.service';
import { LiquidacionService } from './liquidacion.service';
import { OrdenServicioService } from './orden-servicio.service';

describe('Servicios de liquidación (contrato v1)', () => {
  const api = environment.apiUrl;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  describe('LiquidacionService', () => {
    it('cubre todos los endpoints', () => {
      const s = TestBed.inject(LiquidacionService);
      const liq = { id: 4, nrodoc: 'L-1' };

      s.registrarLiquidacionBD(liq, 1).subscribe();
      const post = http.expectOne(`${api}/empresas/1/liquidaciones`);
      expect(post.request.method).toBe('POST');
      expect(post.request.body).toBe(liq);
      post.flush({});

      s.actualizarLiquidacionBD(liq, 1).subscribe();
      const put = http.expectOne(`${api}/empresas/1/liquidaciones/4`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body).toBe(liq);
      put.flush({});

      s.obtenerLiquidacionPorNroDoc(1, 'L-1').subscribe();
      const srv1 = http.expectOne((r) => r.url === `${api}/empresas/1/liquidaciones/SRV1`);
      expect(srv1.request.method).toBe('GET');
      expect(srv1.request.params.get('nroDocLiq')).toBe('L-1');
      srv1.flush({});

      s.validarLiquidacionPorNroDoc(1, 'L-1').subscribe();
      const srv5 = http.expectOne((r) => r.url === `${api}/empresas/1/liquidaciones/SRV5`);
      expect(srv5.request.params.get('nroDocLiq')).toBe('L-1');
      srv5.flush({});

      s.listarLiquidacionesPorEmpresa(1).subscribe();
      const lista = http.expectOne(`${api}/empresas/1/liquidaciones`);
      expect(lista.request.method).toBe('GET');
      lista.flush([]);

      s.listarLiquidacionesPorFiltro(1, 'L-1', 2, 3, 4, 5, 'a', 'b').subscribe();
      const srv0 = http.expectOne((r) => r.url === `${api}/empresas/1/liquidaciones/SRV0`);
      expect(srv0.request.params.keys().sort()).toEqual(
        ['destino', 'estado', 'fechaFin', 'fechaIni', 'nroDocLiq', 'origen', 'tipoBusqueda'],
      );
      expect(srv0.request.params.get('origen')).toBe('2');
      expect(srv0.request.params.get('destino')).toBe('3');
      expect(srv0.request.params.get('estado')).toBe('4');
      expect(srv0.request.params.get('tipoBusqueda')).toBe('5');
      srv0.flush([]);

      s.eliminarLiquidacionBD(1, liq).subscribe();
      const del = http.expectOne(`${api}/empresas/1/liquidaciones/L-1`);
      expect(del.request.method).toBe('DELETE');
      del.flush({});
    });
  });

  describe('ImpuestoService', () => {
    it('listar y obtener por id', () => {
      const s = TestBed.inject(ImpuestoService);
      s.listarImpuestosSistema().subscribe();
      const a = http.expectOne(`${api}/impuestos`);
      expect(a.request.method).toBe('GET');
      a.flush([]);
      s.obtenerValorImpuesto(1).subscribe();
      const b = http.expectOne(`${api}/impuestos/1`);
      expect(b.request.method).toBe('GET');
      b.flush({});
    });
  });

  describe('OrdenServicioService', () => {
    it('cubre todos los endpoints', () => {
      const s = TestBed.inject(OrdenServicioService);
      const orden = { id: 8 };

      s.registrarOrdenServicioBD(orden, 1).subscribe();
      const post = http.expectOne(`${api}/empresas/1/ordenes-servicio`);
      expect(post.request.method).toBe('POST');
      expect(post.request.body).toBe(orden);
      post.flush({});

      s.actualizarLiquidacionBD(orden, 1).subscribe();
      const put = http.expectOne(`${api}/empresas/1/orden-servicio/8`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body).toBe(orden);
      put.flush({});

      s.actualizarOrdenServicioBD(orden, 1).subscribe();
      http.expectOne(`${api}/empresas/1/orden-servicio/8`).flush({});

      s.listarOrdenesServicioPorEmpresa(1).subscribe();
      const lista = http.expectOne(`${api}/empresas/1/ordenes-servicio`);
      expect(lista.request.method).toBe('GET');
      lista.flush([]);

      s.obtenerOrdenServicioPorNroDoc(1, 'OS1').subscribe();
      const srv1 = http.expectOne((r) => r.url === `${api}/empresas/1/ordenes-servicio/SRV1`);
      expect(srv1.request.params.get('nroOrden')).toBe('OS1');
      srv1.flush({});

      s.listarGuiasPorOrdenServicio(1, 'OS1').subscribe();
      const srv2 = http.expectOne((r) => r.url === `${api}/empresas/1/ordenes-servicio/SRV2`);
      expect(srv2.request.params.get('nroOrdenServicio')).toBe('OS1');
      srv2.flush([]);

      s.listarOrdenesServicioPorFiltro(1, 'OS1', 2, 3, 'a', 'b').subscribe();
      const srv0 = http.expectOne((r) => r.url === `${api}/empresas/1/ordenes-servicio/SRV0`);
      expect(srv0.request.params.keys().sort()).toEqual(['estado', 'facturado', 'fechaFin', 'fechaIni', 'nroOrden']);
      expect(srv0.request.params.get('estado')).toBe('2');
      expect(srv0.request.params.get('facturado')).toBe('3');
      srv0.flush([]);
    });
  });

  it('referencia de tipo Documento disponible', () => {
    const d: Documento = { id: 1 };
    expect(d.id).toBe(1);
  });
});
