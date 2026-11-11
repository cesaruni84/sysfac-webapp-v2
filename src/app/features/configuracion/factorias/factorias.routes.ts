import { Routes } from '@angular/router';

/**
 * Rutas del maestro `factorias` (montado en /forms/configuracion/factorias). Tarea 4.4.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Plantas | SYSFAC',
    data: { title: 'Plantas', breadcrumb: 'Plantas' },
    loadComponent: () =>
      import('./maestro-factorias').then((m) => m.MaestroFactorias),
  },
];

export default routes;
