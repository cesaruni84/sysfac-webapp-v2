import { Routes } from '@angular/router';

/**
 * Rutas del maestro `productos` (montado en /forms/configuracion/productos). Tarea 4.5.
 * STUB de la oleada 5: muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Productos | SYSFAC',
    data: { title: 'Productos', breadcrumb: 'Productos' },
    loadComponent: () =>
      import('../../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
