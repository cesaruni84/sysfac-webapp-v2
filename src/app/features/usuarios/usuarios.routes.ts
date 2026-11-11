import { Routes } from '@angular/router';

/**
 * Rutas de la feature `usuarios` (profile de v1; montada en /profile).
 * v1 enlazaba a /profile/overview y /profile/settings desde el menú de usuario y el home:
 * se conservan esas URLs redirigiendo a la única pantalla real.
 */
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Usuarios | SYSFAC',
    data: { title: 'Usuarios', breadcrumb: 'Usuarios' },
    loadComponent: () => import('./usuarios-page').then((m) => m.UsuariosPage),
  },
  { path: 'overview', redirectTo: '', pathMatch: 'full' },
  { path: 'settings', redirectTo: '', pathMatch: 'full' },
  { path: 'blank', redirectTo: '', pathMatch: 'full' },
];

export default routes;
