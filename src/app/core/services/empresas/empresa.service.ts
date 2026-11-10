import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Empresa } from '../../models';

/** Port de `EmpresaService` (v1 `views/sessions`): combo de empresas del login. */
@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/empresas`;

  listarComboEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.url);
  }
}
