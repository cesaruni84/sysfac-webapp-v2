import {
  HttpBackend,
  HttpResponse,
  provideHttpClient,
  type HttpEvent,
  type HttpRequest,
} from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { of, type Observable } from 'rxjs';

/** Backend HTTP de pruebas que responde al instante `200 []` a cualquier petición. */
class HttpBackendVacio implements HttpBackend {
  handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    return of(new HttpResponse({ status: 200, body: [], url: req.urlWithParams }));
  }
}

/**
 * Para specs de nivel de app (rutas y navegación) que montan pantallas reales: evita peticiones
 * de red de verdad al backend (lentas e inestables) sin tener que simular cada endpoint.
 * Solo para pruebas; no lo usa el código de la aplicación.
 */
export function provideHttpVacio(): (Provider | EnvironmentProviders)[] {
  return [provideHttpClient(), { provide: HttpBackend, useClass: HttpBackendVacio }];
}
