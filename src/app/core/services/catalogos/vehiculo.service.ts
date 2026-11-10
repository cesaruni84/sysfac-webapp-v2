import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InfoResponse, Vehiculo } from '../../models';
import { jsonHttpOptions } from '../http-options';

/**
 * Port de `VehiculoService` de v1 (sin `@Cacheable` de 5 min).
 * v1 genera `empresas/vehiculos//{id}` (doble barra) en el PUT; se conserva.
 */
@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/empresas/`;
  private readonly url2 = `${environment.apiUrl}/empresas/vehiculos/`;

  /** v1 ignora `idEmpresa`: `GET empresas/vehiculos`. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma de v1 conservada
  listarTodosLosVehiculosPorEmpresa(_idEmpresa?: number): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.url}vehiculos`);
  }

  registrarVehiculo(vehiculo: Vehiculo): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(this.url2, vehiculo, jsonHttpOptions);
  }

  actualizarVehiculo(vehiculo: Vehiculo): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.url2}/${vehiculo.id}`, vehiculo, jsonHttpOptions);
  }
}
