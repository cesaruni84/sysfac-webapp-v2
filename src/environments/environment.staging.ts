import { Environment } from './environment.model';

/**
 * Entorno de staging: vistas previas de Cloudflare Pages (`develop`, `wave/*` y PR).
 * TODO: reemplazar por la URL pública HTTPS del backend de staging cuando exista.
 */
export const environment: Environment = {
  name: 'staging',
  production: true,
  apiUrl: 'http://localhost:8443/v1/sisyfac/api',
};
