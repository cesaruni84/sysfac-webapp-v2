import { Routes } from '@angular/router';

/**
 * Rutas del maestro `vehiculos` (montado en /forms/configuracion/vehiculos). Tarea 4.4.
 * STUB de la oleada 5: muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Vehículos | SYSFAC',
    data: { title: 'Vehículos', breadcrumb: 'Vehículos' },
    loadComponent: () =>
      import('../../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
