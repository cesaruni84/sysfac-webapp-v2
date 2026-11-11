import { Routes } from '@angular/router';

/**
 * Rutas del maestro `tarifas` (montado en /forms/configuracion/tarifas). Tarea 4.5.
 * STUB de la oleada 5: muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Tarifas | SYSFAC',
    data: { title: 'Tarifas', breadcrumb: 'Tarifas' },
    loadComponent: () =>
      import('../../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
