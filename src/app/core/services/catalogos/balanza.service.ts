import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Balanza } from '../../models';

/** Port de `BalanzaService` de v1 (sin `@Cacheable` de 5 min). */
@Injectable({ providedIn: 'root' })
export class BalanzaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/balanzas`;

  listarComboBalanzas(): Observable<Balanza[]> {
    return this.http.get<Balanza[]>(this.url);
  }
}
