import { Routes } from '@angular/router';

/**
 * Rutas del maestro `factorias` (montado en /forms/configuracion/factorias). Tarea 4.4.
 * STUB de la oleada 5: muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Plantas | SYSFAC',
    data: { title: 'Plantas', breadcrumb: 'Plantas' },
    loadComponent: () =>
      import('../../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
