import { Routes } from '@angular/router';

/** Rutas de la feature `auth` (login y selección de empresa; montada en /sessions). */
const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'signin' },
  {
    path: 'signin',
    title: 'Iniciar sesión | SYSFAC',
    data: { title: 'Iniciar sesión', breadcrumb: 'Iniciar sesión' },
    loadComponent: () => import('./signin/signin').then((m) => m.Signin),
  },
];

export default routes;
