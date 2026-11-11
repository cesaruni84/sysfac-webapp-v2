import { Routes } from '@angular/router';

/**
 * Rutas del maestro `choferes` (montado en /forms/configuracion/choferes). Tarea 4.4.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Choferes | SYSFAC',
    data: { title: 'Choferes', breadcrumb: 'Choferes' },
    loadComponent: () =>
      import('./maestro-choferes').then((m) => m.MaestroChoferes),
  },
];

export default routes;
