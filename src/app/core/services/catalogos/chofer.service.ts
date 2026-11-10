import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Chofer, InfoResponse } from '../../models';
import { jsonHttpOptions } from '../http-options';

/** Port de `ChoferService` de v1. Registrar/actualizar usan empresa fija 1, igual que v1. */
@Injectable({ providedIn: 'root' })
export class ChoferService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/empresas/`;

  listarComboChoferes(idEmpresa: number): Observable<Chofer[]> {
    return this.http.get<Chofer[]>(`${this.url}${idEmpresa}/choferes`);
  }

  listarTodosLosChoferes(idEmpresa: number): Observable<Chofer[]> {
    return this.http.get<Chofer[]>(`${this.url}${idEmpresa}/choferes`);
  }

  registrarChofer(chofer: Chofer): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(`${this.url}1/choferes`, chofer, jsonHttpOptions);
  }

  actualizarChofer(chofer: Chofer): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.url}1/choferes/${chofer.id}`, chofer, jsonHttpOptions);
  }
}
