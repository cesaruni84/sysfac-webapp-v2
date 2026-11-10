import { Environment } from './environment.model';

/**
 * Entorno de producción (configuración por defecto de `ng build`).
 * TODO: reemplazar por la URL pública HTTPS del backend antes de la tarea 5.2.
 */
export const environment: Environment = {
  name: 'production',
  production: true,
  apiUrl: 'http://localhost:8443/v1/sisyfac/api',
};
