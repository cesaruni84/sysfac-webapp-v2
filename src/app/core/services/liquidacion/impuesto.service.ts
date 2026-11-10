import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Impuesto } from '../../models';

/** Port de `ImpuestoService` de v1. */
@Injectable({ providedIn: 'root' })
export class ImpuestoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/impuestos`;

  listarImpuestosSistema(): Observable<Impuesto[]> {
    return this.http.get<Impuesto[]>(this.url);
  }

  /** 1 - IGV, 2 - ISC. */
  obtenerValorImpuesto(idImpuesto: number): Observable<Impuesto> {
    return this.http.get<Impuesto>(`${this.url}/${idImpuesto}`);
  }
}
