import { Routes } from '@angular/router';

/**
 * Rutas de la feature `usuarios` (usuarios (profile de v1); montada en /profile).
 * STUB de la oleada 1: cada ruta muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: '',
    title: 'Usuarios | SYSFAC',
    data: { title: 'Usuarios', breadcrumb: 'Usuarios' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
