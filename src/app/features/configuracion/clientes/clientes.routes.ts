import { Routes } from '@angular/router';

/**
 * Rutas del maestro `clientes` (montado en /forms/configuracion/clientes). Tarea 4.5.
 * STUB de la oleada 5: muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Clientes | SYSFAC',
    data: { title: 'Clientes', breadcrumb: 'Clientes' },
    loadComponent: () =>
      import('../../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
