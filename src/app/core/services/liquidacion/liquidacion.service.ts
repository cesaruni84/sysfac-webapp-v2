import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InfoResponse, Liquidacion } from '../../models';
import { jsonHttpOptions } from '../http-options';

/** Port de `LiquidacionService` de v1 (sin `@Cacheable` en `listarLiquidacionesPorEmpresa`). */
@Injectable({ providedIn: 'root' })
export class LiquidacionService {
  private readonly http = inject(HttpClient);
  private readonly empresas = `${environment.apiUrl}/empresas/`;

  registrarLiquidacionBD(liquidacion: Liquidacion, idEmpresa: number): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(`${this.empresas}${idEmpresa}/liquidaciones`, liquidacion, jsonHttpOptions);
  }

  actualizarLiquidacionBD(liquidacion: Liquidacion, idEmpresa: number): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(
      `${this.empresas}${idEmpresa}/liquidaciones/${liquidacion.id}`,
      liquidacion,
      jsonHttpOptions,
    );
  }

  obtenerLiquidacionPorNroDoc(idEmpresa: number, nroDocLiq: string): Observable<Liquidacion> {
    const params = new HttpParams().set('nroDocLiq', nroDocLiq);
    return this.http.get<Liquidacion>(`${this.empresas}${idEmpresa}/liquidaciones/SRV1`, { params });
  }

  /** v1 la lee como InfoResponse (`codeMessage === 'MFA1001'`). */
  validarLiquidacionPorNroDoc(idEmpresa: number, nroDocLiq: string): Observable<InfoResponse> {
    const params = new HttpParams().set('nroDocLiq', nroDocLiq);
    return this.http.get<InfoResponse>(`${this.empresas}${idEmpresa}/liquidaciones/SRV5`, { params });
  }

  listarLiquidacionesPorEmpresa(idEmpresa: number): Observable<Liquidacion[]> {
    return this.http.get<Liquidacion[]>(`${this.empresas}${idEmpresa}/liquidaciones`);
  }

  listarLiquidacionesPorFiltro(
    idEmpresa: number,
    nroDocLiq: string,
    idOrigen: number,
    idDestino: number,
    idEstado: number,
    tipoBusqueda: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<Liquidacion[]> {
    const params = new HttpParams()
      .set('nroDocLiq', nroDocLiq.toString())
      .set('origen', idOrigen.toString())
      .set('destino', idDestino.toString())
      .set('estado', idEstado.toString())
      .set('tipoBusqueda', tipoBusqueda.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<Liquidacion[]>(`${this.empresas}${idEmpresa}/liquidaciones/SRV0`, { params });
  }

  /** v1 tipa `liquidacion` como `any` y usa `liquidacion.nrodoc` en la URL. */
  eliminarLiquidacionBD(idEmpresa: number, liquidacion: Pick<Liquidacion, 'nrodoc'>): Observable<InfoResponse> {
    if (!liquidacion.nrodoc) {
      throw new Error('Liquidación sin nrodoc: no se puede construir la URL de eliminación');
    }
    return this.http.delete<InfoResponse>(
      `${this.empresas}${idEmpresa}/liquidaciones/${liquidacion.nrodoc}`,
      jsonHttpOptions,
    );
  }
}
