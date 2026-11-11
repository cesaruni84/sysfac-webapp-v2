import { Routes } from '@angular/router';

/**
 * Rutas del maestro `vehiculos` (montado en /forms/configuracion/vehiculos). Tarea 4.4.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Vehículos | SYSFAC',
    data: { title: 'Vehículos', breadcrumb: 'Vehículos' },
    loadComponent: () =>
      import('./maestro-vehiculos').then((m) => m.MaestroVehiculos),
  },
];

export default routes;
