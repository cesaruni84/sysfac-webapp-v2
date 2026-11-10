import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GuiaRemision, InfoResponse, OrdenServicio } from '../../models';
import { jsonHttpOptions } from '../http-options';

/** Port de `OrdenServicioService` de v1. */
@Injectable({ providedIn: 'root' })
export class OrdenServicioService {
  private readonly http = inject(HttpClient);
  private readonly empresas = `${environment.apiUrl}/empresas/`;

  registrarOrdenServicioBD(ordenServicio: OrdenServicio, idEmpresa: number): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(`${this.empresas}${idEmpresa}/ordenes-servicio`, ordenServicio, jsonHttpOptions);
  }

  /**
   * Actualiza una orden de servicio. v1 la llama `actualizarLiquidacionBD` (nombre heredado
   * por error); se conserva ese nombre. Usa la URL singular `/orden-servicio/{id}`.
   */
  actualizarLiquidacionBD(ordenServicio: OrdenServicio, idEmpresa: number): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(
      `${this.empresas}${idEmpresa}/orden-servicio/${ordenServicio.id}`,
      ordenServicio,
      jsonHttpOptions,
    );
  }

  listarOrdenesServicioPorEmpresa(idEmpresa: number): Observable<OrdenServicio[]> {
    return this.http.get<OrdenServicio[]>(`${this.empresas}${idEmpresa}/ordenes-servicio`);
  }

  obtenerOrdenServicioPorNroDoc(idEmpresa: number, nroOrden: string): Observable<OrdenServicio> {
    const params = new HttpParams().set('nroOrden', nroOrden);
    return this.http.get<OrdenServicio>(`${this.empresas}${idEmpresa}/ordenes-servicio/SRV1`, { params });
  }

  listarGuiasPorOrdenServicio(idEmpresa: number, nroOrden: string): Observable<GuiaRemision[]> {
    const params = new HttpParams().set('nroOrdenServicio', nroOrden);
    return this.http.get<GuiaRemision[]>(`${this.empresas}${idEmpresa}/ordenes-servicio/SRV2`, { params });
  }

  listarOrdenesServicioPorFiltro(
    idEmpresa: number,
    nroOrden: string,
    idEstado: number,
    conFactura: number,
    fechaIni: string,
    fechaFin: string,
  ): Observable<OrdenServicio[]> {
    const params = new HttpParams()
      .set('nroOrden', nroOrden.toString())
      .set('estado', idEstado.toString())
      .set('facturado', conFactura.toString())
      .set('fechaIni', fechaIni.toString())
      .set('fechaFin', fechaFin.toString());
    return this.http.get<OrdenServicio[]>(`${this.empresas}${idEmpresa}/ordenes-servicio/SRV0`, { params });
  }
}
