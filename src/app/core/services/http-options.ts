import { HttpHeaders } from '@angular/common/http';

/** Cabeceras que v1 envía en todas las escrituras (POST/PUT/DELETE). */
export const jsonHttpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};
