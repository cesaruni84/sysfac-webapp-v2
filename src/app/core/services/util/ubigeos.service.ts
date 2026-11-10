import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ubigeo } from '../../models';

/**
 * Port de `UbigeosService` de v1. Carga un JSON estático (no es el backend), con la misma
 * URL relativa de v1: `./assets/ubigeo-reniec.json`.
 * Requiere que el archivo exista en `public/assets/ubigeo-reniec.json` (ver reporte 2.2).
 */
@Injectable({ providedIn: 'root' })
export class UbigeosService {
  private readonly http = inject(HttpClient);

  cargarUbigeos(): Observable<Ubigeo[]> {
    return this.http.get<Ubigeo[]>('./assets/ubigeo-reniec.json');
  }
}
