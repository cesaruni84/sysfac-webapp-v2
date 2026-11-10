import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MotivoTraslado } from '../../models';

/** Port de `MotivoTrasladoService` de v1 (sin `@Cacheable`). */
@Injectable({ providedIn: 'root' })
export class MotivoTrasladoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/motivosTraslado`;

  listarComboMotivosTraslado(): Observable<MotivoTraslado[]> {
    return this.http.get<MotivoTraslado[]>(this.url);
  }
}
