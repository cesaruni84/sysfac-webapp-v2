import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Factoria, InfoResponse } from '../../models';
import { jsonHttpOptions } from '../http-options';

/**
 * Port de `FactoriaService` de v1 (sin `@Cacheable` de 5 min).
 * Se conservan las URLs exactas de v1, incluida la barra final de `factorias/` y el
 * doble `//` que v1 genera en PUT/DELETE (`factorias//{id}`).
 */
@Injectable({ providedIn: 'root' })
export class FactoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clientes/factorias/SRV1`;
  private readonly url2 = `${environment.apiUrl}/clientes/factorias/`;

  /** v1 ignora `tipoFactoria` en esta llamada. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma de v1 conservada
  listarComboFactorias(_tipoFactoria?: string): Observable<Factoria[]> {
    return this.http.get<Factoria[]>(this.url2);
  }

  /** v1 ignora `tipoFactoria` en esta llamada. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma de v1 conservada
  listarTodasLasFactorias(_tipoFactoria?: string): Observable<Factoria[]> {
    return this.http.get<Factoria[]>(this.url2);
  }

  listarComboFactoriasPorTipo(tipoFactoria: string): Observable<Factoria[]> {
    const params = new HttpParams().set('tipoFactoria', tipoFactoria);
    return this.http.get<Factoria[]>(this.url, { params });
  }

  registrarFactoria(factoria: Factoria): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(this.url2, factoria, jsonHttpOptions);
  }

  actualizarFactoria(factoria: Factoria): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.url2}/${factoria.id}`, factoria, jsonHttpOptions);
  }

  eliminarFactoria(factoria: Factoria): Observable<InfoResponse> {
    return this.http.delete<InfoResponse>(`${this.url2}/${factoria.id}`, jsonHttpOptions);
  }
}
