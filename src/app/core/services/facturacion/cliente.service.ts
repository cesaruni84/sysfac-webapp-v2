import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cliente, InfoResponse } from '../../models';
import { jsonHttpOptions } from '../http-options';

/** Port de `ClienteService` de v1 (sin `@Cacheable` de 5 min en el listado). */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly empresas = `${environment.apiUrl}/empresas/`;
  private readonly clientes = `${environment.apiUrl}/empresas/clientes`;

  listarClientesPorEmpresa(idEmpresa: number): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.empresas}${idEmpresa}/clientes`);
  }

  registrarCliente(cliente: Cliente): Observable<InfoResponse> {
    return this.http.post<InfoResponse>(this.clientes, cliente, jsonHttpOptions);
  }

  actualizarCliente(cliente: Cliente): Observable<InfoResponse> {
    return this.http.put<InfoResponse>(`${this.clientes}/${cliente.id}`, cliente, jsonHttpOptions);
  }
}
