import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InfoResponse, TarifaRuta } from '../../models';
import { jsonHttpOptions } from '../http-options';

/** Port de `TarifaRutaService` de v1. `registrarTarifa` usa empresa fija 1, igual que v1. */
@Injectable({ providedIn: 'root' })
export class TarifaRutaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/empresas/`;

  listarTodasLasTarifasPorEmpresa(idEmpresa: number): Observable<TarifaRuta[]> {
    return this.http.get<TarifaRuta[]>(`${this.url}${idEmpresa}/tarifas`);
  }

  registrarTarifa(tarifaRuta: TarifaRuta): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(`${this.url}1/tarifas`, tarifaRuta, jsonHttpOptions);
  }

  actualizarTarifa(tarifaRuta: TarifaRuta): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(
      `${this.url}${tarifaRuta.empresa?.id}/tarifas/${tarifaRuta.id}`,
      tarifaRuta,
      jsonHttpOptions,
    );
  }

  eliminarTarifa(tarifaRuta: TarifaRuta): Observable<InfoResponse> {
    return this.http.delete<InfoResponse>(
      `${this.url}${tarifaRuta.empresa?.id}/tarifas/${tarifaRuta.id}`,
      jsonHttpOptions,
    );
  }
}
