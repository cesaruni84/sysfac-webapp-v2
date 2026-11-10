import { Routes } from '@angular/router';

/**
 * Rutas de la feature `mapa` (localizar unidades; montada en /map).
 * STUB de la oleada 1: cada ruta muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Localizar unidades | SYSFAC',
    data: { title: 'Localizar unidades', breadcrumb: 'Localizar unidades' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
