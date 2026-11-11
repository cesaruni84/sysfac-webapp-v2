import { Routes } from '@angular/router';

/**
 * Rutas del maestro `choferes` (montado en /forms/configuracion/choferes). Tarea 4.4.
 * STUB de la oleada 5: muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Choferes | SYSFAC',
    data: { title: 'Choferes', breadcrumb: 'Choferes' },
    loadComponent: () =>
      import('../../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
