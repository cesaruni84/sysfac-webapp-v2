import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GrillaGuiaRemision, GuiaRemision, InfoResponse } from '../../models';
import { jsonHttpOptions } from '../http-options';

/**
 * Port de `GuiaRemisionService` de v1.
 * v1 cacheaba `listarGrillaGuias` y `listarGuiasConFiltrosCache` con `@Cacheable` (ngx-cacheable);
 * en v2 no se cachea (ver reporte de la tarea 2.2).
 */
@Injectable({ providedIn: 'root' })
export class GuiaRemisionService {
  private readonly http = inject(HttpClient);
  private readonly empresas = `${environment.apiUrl}/empresas/`;
  private readonly guias = `${environment.apiUrl}/guias`;
  private readonly liquidaciones = `${environment.apiUrl}/liquidaciones`;

  listarGrillaGuias(idEmpresa: number): Observable<GrillaGuiaRemision[]> {
    return this.http.get<GrillaGuiaRemision[]>(`${this.empresas}${idEmpresa}/guias/SRV1`);
  }

  listarGuiasConFiltros(
    idEmpresa: number,
    nroSerie: string,
    nroSecuencia: string,
    idEstado: number,
    idChofer: number,
    origen: number,
    idDestino: number,
    formateo: boolean,
    tipoBusqueda: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<GuiaRemision[]> {
    const params = new HttpParams()
      .set('nroSerie', nroSerie)
      .set('nroSecuencia', nroSecuencia)
      .set('chofer', idChofer.toString())
      .set('origen', origen.toString())
      .set('destino', idDestino.toString())
      .set('estado', idEstado.toString())
      .set('conFormateo', formateo.toString())
      .set('tipoBusqueda', tipoBusqueda.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<GuiaRemision[]>(`${this.empresas}${idEmpresa}/guias/SRV2`, { params });
  }

  listarGuiasPorGuiaCliente(
    idEmpresa: number,
    nroSerieCli: string,
    nroSecuenciaCli: string,
    idEstado: number,
    idChofer: number,
    origen: number,
    idDestino: number,
    formateo: boolean,
    tipoBusqueda: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<GuiaRemision[]> {
    const params = new HttpParams()
      .set('nroSerieCli', nroSerieCli)
      .set('nroSecuenciaCli', nroSecuenciaCli)
      .set('chofer', idChofer.toString())
      .set('origen', origen.toString())
      .set('destino', idDestino.toString())
      .set('estado', idEstado.toString())
      .set('conFormateo', formateo.toString())
      .set('tipoBusqueda', tipoBusqueda.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<GuiaRemision[]>(`${this.empresas}${idEmpresa}/guias/SRV6`, { params });
  }

  /** Versión "Cache" de v1: mismo endpoint SRV2 con menos parámetros. */
  listarGuiasConFiltrosCache(
    idEmpresa: number,
    nroSerie: string,
    nroSecuencia: string,
    idEstado: number,
    idChofer: number,
    idDestino: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<GuiaRemision[]> {
    const params = new HttpParams()
      .set('nroSerie', nroSerie)
      .set('nroSecuencia', nroSecuencia)
      .set('chofer', idChofer.toString())
      .set('destino', idDestino.toString())
      .set('estado', idEstado.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<GuiaRemision[]>(`${this.empresas}${idEmpresa}/guias/SRV2`, { params });
  }

  /** v1: tipado como `GrillaGuiaRemision[]` (SRV3 sin params). Se conserva el tipo de v1. */
  obtenerGuiaRemision(idEmpresa: number): Observable<GrillaGuiaRemision[]> {
    return this.http.get<GrillaGuiaRemision[]>(`${this.empresas}${idEmpresa}/guias/SRV3`);
  }

  registrarGuiaRemisionBD(guiaRemision: GuiaRemision): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(this.guias, guiaRemision, jsonHttpOptions);
  }

  actualizarGuiaRemisionBD(guiaRemision: GuiaRemision): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.guias}/${guiaRemision.id}`, guiaRemision, jsonHttpOptions);
  }

  actualizarTarifaGuiaRemision(guiaRemision: GuiaRemision): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.guias}/${guiaRemision.id}/tarifa`, guiaRemision, jsonHttpOptions);
  }

  /** v1 usa id fijo 0 en la URL (`/guias/0/extorno`). */
  anularGuiaRemisionBD(guiaRemision: GuiaRemision): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.guias}/0/extorno`, guiaRemision, jsonHttpOptions);
  }

  actualizarGuiaRemisionLiquidacion(guiaRemision: GuiaRemision, idLiquidacion: number): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(
      `${this.liquidaciones}/${idLiquidacion}/guias/${guiaRemision.id}`,
      guiaRemision,
      jsonHttpOptions,
    );
  }

  obtenerGuiaRemisionxNroGuia(idEmpresa: number, nroSerie: string, nroSecuencia: string): Observable<GuiaRemision> {
    const params = new HttpParams().set('nroSerie', nroSerie).set('nroSecuencia', nroSecuencia);
    return this.http.get<GuiaRemision>(`${this.empresas}${idEmpresa}/guias/SRV3`, { params });
  }

  /** v1 la lee como InfoResponse (`codeMessage === 'GRT102'`). */
  buscaGuiaRemisionxNroGuia(idEmpresa: number, nroSerie: string, nroSecuencia: string): Observable<InfoResponse> {
    const params = new HttpParams().set('nroSerie', nroSerie).set('nroSecuencia', nroSecuencia);
    return this.http.get<InfoResponse>(`${this.empresas}${idEmpresa}/guias/SRV5`, { params });
  }

  /** Nota: v1 usa `/guia-cliente/SRV3` (singular) aquí y `/guias-cliente/SRV5` (plural) abajo. */
  obtenerGuiaRemisionxNroGuiaCliente(
    idEmpresa: number,
    nroSerieCli: string,
    nroSecuenciaCli: string,
  ): Observable<GuiaRemision> {
    const params = new HttpParams().set('nroSerieCli', nroSerieCli).set('nroSecuenciaCli', nroSecuenciaCli);
    return this.http.get<GuiaRemision>(`${this.empresas}${idEmpresa}/guia-cliente/SRV3`, { params });
  }

  buscaGuiaRemisionxNroGuiaCliente(
    idEmpresa: number,
    nroSerie: string,
    nroSecuencia: string,
  ): Observable<InfoResponse> {
    const params = new HttpParams().set('nroSerie', nroSerie).set('nroSecuencia', nroSecuencia);
    return this.http.get<InfoResponse>(`${this.empresas}${idEmpresa}/guias-cliente/SRV5`, { params });
  }

  listarGuiasRemisionPorLiquidar(
    idEmpresa: number,
    idOrigen: number,
    idDestino: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<GuiaRemision[]> {
    const params = new HttpParams()
      .set('origen', idOrigen.toString())
      .set('destino', idDestino.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<GuiaRemision[]>(`${this.empresas}${idEmpresa}/guias/SRV0`, { params });
  }

  listarGuiasRemisionPorFacturar(
    idEmpresa: number,
    idOrigen: number,
    idDestino: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<GuiaRemision[]> {
    const params = new HttpParams()
      .set('origen', idOrigen.toString())
      .set('destino', idDestino.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<GuiaRemision[]>(`${this.empresas}${idEmpresa}/guias/SRV4`, { params });
  }

  eliminarGuiaBD(nroSerie: string, nroSecuencia: string, idEmpresa: number): Observable<InfoResponse> {
    return this.http.delete<InfoResponse>(
      `${this.empresas}${idEmpresa}/guias/${nroSerie}/${nroSecuencia}`,
      jsonHttpOptions,
    );
  }
}
