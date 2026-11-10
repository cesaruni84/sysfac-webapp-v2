import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UnidadMedida } from '../../models';

/** Port de `UnidadMedidaService` de v1. */
@Injectable({ providedIn: 'root' })
export class UnidadMedidaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/unidadesMedida`;

  listarComboUnidadesMedida(): Observable<UnidadMedida[]> {
    return this.http.get<UnidadMedida[]>(this.url);
  }
}
