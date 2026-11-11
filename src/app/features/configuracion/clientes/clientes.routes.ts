import { Routes } from '@angular/router';

/** Rutas del maestro `clientes` (montado en /forms/configuracion/clientes). Tarea 4.5. */
const routes: Routes = [
  {
    path: '',
    title: 'Clientes | SYSFAC',
    data: { title: 'Clientes', breadcrumb: 'Clientes' },
    loadComponent: () => import('./maestro-clientes').then((m) => m.MaestroClientes),
  },
];

export default routes;
