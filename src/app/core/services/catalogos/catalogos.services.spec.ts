import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { EmpresaService } from '../empresas/empresa.service';
import { BalanzaService } from './balanza.service';
import { ChoferService } from './chofer.service';
import { FactoriaService } from './factoria.service';
import { MotivoTrasladoService } from './motivo-traslado.service';
import { ProductoService } from './producto.service';
import { TarifaRutaService } from './tarifa-ruta.service';
import { UnidadMedidaService } from './unidad-medida.service';
import { VehiculoService } from './vehiculo.service';

describe('Servicios de catálogos (contrato v1)', () => {
  const api = environment.apiUrl;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function ver(url: string, method: string, body?: unknown) {
    const req = http.expectOne(url);
    expect(req.request.method).toBe(method);
    if (body !== undefined) {
      expect(req.request.body).toBe(body);
    }
    req.flush(method === 'GET' ? [] : {});
  }

  it('FactoriaService', () => {
    const s = TestBed.inject(FactoriaService);
    const f = { id: 2 };
    s.listarComboFactorias('X').subscribe();
    ver(`${api}/clientes/factorias/`, 'GET');
    s.listarTodasLasFactorias('X').subscribe();
    ver(`${api}/clientes/factorias/`, 'GET');
    s.listarComboFactoriasPorTipo('ORIGEN').subscribe();
    const req = http.expectOne((r) => r.url === `${api}/clientes/factorias/SRV1`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('tipoFactoria')).toBe('ORIGEN');
    req.flush([]);
    s.registrarFactoria(f).subscribe();
    ver(`${api}/clientes/factorias/`, 'POST', f);
    s.actualizarFactoria(f).subscribe();
    ver(`${api}/clientes/factorias//2`, 'PUT', f);
    s.eliminarFactoria(f).subscribe();
    ver(`${api}/clientes/factorias//2`, 'DELETE');
  });

  it('VehiculoService', () => {
    const s = TestBed.inject(VehiculoService);
    const v = { id: 4 };
    s.listarTodosLosVehiculosPorEmpresa(1).subscribe();
    ver(`${api}/empresas/vehiculos`, 'GET');
    s.registrarVehiculo(v).subscribe();
    ver(`${api}/empresas/vehiculos/`, 'POST', v);
    s.actualizarVehiculo(v).subscribe();
    ver(`${api}/empresas/vehiculos//4`, 'PUT', v);
  });

  it('ChoferService (empresa fija 1 al escribir)', () => {
    const s = TestBed.inject(ChoferService);
    const c = { id: 6 };
    s.listarComboChoferes(3).subscribe();
    ver(`${api}/empresas/3/choferes`, 'GET');
    s.listarTodosLosChoferes(3).subscribe();
    ver(`${api}/empresas/3/choferes`, 'GET');
    s.registrarChofer(c).subscribe();
    ver(`${api}/empresas/1/choferes`, 'POST', c);
    s.actualizarChofer(c).subscribe();
    ver(`${api}/empresas/1/choferes/6`, 'PUT', c);
  });

  it('ProductoService', () => {
    const s = TestBed.inject(ProductoService);
    const p = { id: 9 };
    s.listarComboProductos().subscribe();
    ver(`${api}/productos`, 'GET');
    s.listarComboProductosServicios(2).subscribe();
    ver(`${api}/empresas/2/productos-servicios/SRV1`, 'GET');
    s.registrarProducto(p).subscribe();
    ver(`${api}/empresas/productos`, 'POST', p);
    s.actualizarProducto(p).subscribe();
    ver(`${api}/empresas/productos/9`, 'PUT', p);
  });

  it('TarifaRutaService', () => {
    const s = TestBed.inject(TarifaRutaService);
    const t = { id: 5, empresa: { id: 3 } } as Parameters<TarifaRutaService['registrarTarifa']>[0];
    s.listarTodasLasTarifasPorEmpresa(3).subscribe();
    ver(`${api}/empresas/3/tarifas`, 'GET');
    s.registrarTarifa(t).subscribe();
    ver(`${api}/empresas/1/tarifas`, 'POST', t);
    s.actualizarTarifa(t).subscribe();
    ver(`${api}/empresas/3/tarifas/5`, 'PUT', t);
    s.eliminarTarifa(t).subscribe();
    ver(`${api}/empresas/3/tarifas/5`, 'DELETE');
  });

  it('Balanza, MotivoTraslado, UnidadMedida y Empresa (GET)', () => {
    TestBed.inject(BalanzaService).listarComboBalanzas().subscribe();
    ver(`${api}/balanzas`, 'GET');
    TestBed.inject(MotivoTrasladoService).listarComboMotivosTraslado().subscribe();
    ver(`${api}/motivosTraslado`, 'GET');
    TestBed.inject(UnidadMedidaService).listarComboUnidadesMedida().subscribe();
    ver(`${api}/unidadesMedida`, 'GET');
    TestBed.inject(EmpresaService).listarComboEmpresas().subscribe();
    ver(`${api}/empresas`, 'GET');
  });
});
