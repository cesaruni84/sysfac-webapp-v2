import { Routes } from '@angular/router';

/** Rutas de la feature `dashboard` (página de inicio; montada en /dashboard). */
const routes: Routes = [
  {
    path: '',
    title: 'Principal | SYSFAC',
    data: { title: 'Principal', breadcrumb: 'Principal' },
    loadComponent: () => import('./inicio').then((m) => m.Inicio),
  },
];

export default routes;
