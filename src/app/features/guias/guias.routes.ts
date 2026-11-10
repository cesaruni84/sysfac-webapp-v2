import { Routes } from '@angular/router';

/**
 * Rutas de la feature `guias` (registro y consulta de guías de remisión; montada en /forms).
 * STUB de la oleada 1: cada ruta muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: 'basic',
    title: 'Registro de guías | SYSFAC',
    data: { title: 'Registro de guías', breadcrumb: 'Registro de guías' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'paging',
    title: 'Consulta de guías | SYSFAC',
    data: { title: 'Consulta de guías', breadcrumb: 'Consulta de guías' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
