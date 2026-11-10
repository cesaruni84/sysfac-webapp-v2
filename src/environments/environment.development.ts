import { Environment } from './environment.model';

/** Entorno local (`ng serve`): backend corriendo en la máquina del desarrollador. */
export const environment: Environment = {
  name: 'development',
  production: false,
  apiUrl: 'http://localhost:8443/v1/sisyfac/api',
};
