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
      `${this.url}${this.idEmpresa(tarifaRuta)}/tarifas/${tarifaRuta.id}`,
      tarifaRuta,
      jsonHttpOptions,
    );
  }

  eliminarTarifa(tarifaRuta: TarifaRuta): Observable<InfoResponse> {
    return this.http.delete<InfoResponse>(
      `${this.url}${this.idEmpresa(tarifaRuta)}/tarifas/${tarifaRuta.id}`,
      jsonHttpOptions,
    );
  }

  /** v1 fallaba con TypeError (sin enviar nada) si faltaba la empresa; aquí se falla con un error claro. */
  private idEmpresa(tarifaRuta: TarifaRuta): number {
    const id = tarifaRuta.empresa?.id;
    if (id === undefined || id === null) {
      throw new Error('TarifaRuta sin empresa: no se puede construir la URL de tarifas');
    }
    return id;
  }
}
