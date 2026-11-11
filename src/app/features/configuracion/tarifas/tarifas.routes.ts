import { Routes } from '@angular/router';

/** Rutas del maestro `tarifas` (montado en /forms/configuracion/tarifas). Tarea 4.5. */
const routes: Routes = [
  {
    path: '',
    title: 'Tarifas | SYSFAC',
    data: { title: 'Tarifas', breadcrumb: 'Tarifas' },
    loadComponent: () => import('./maestro-tarifas').then((m) => m.MaestroTarifas),
  },
];

export default routes;
