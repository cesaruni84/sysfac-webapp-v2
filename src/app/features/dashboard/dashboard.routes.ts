import { Routes } from '@angular/router';

/**
 * Rutas de la feature `dashboard` (pantalla principal; montada en /dashboard).
 * STUB de la oleada 1: cada ruta muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Principal | SYSFAC',
    data: { title: 'Principal', breadcrumb: 'Principal' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
