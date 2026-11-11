import { Routes } from '@angular/router';

/** Rutas del maestro `productos` (montado en /forms/configuracion/productos). Tarea 4.5. */
const routes: Routes = [
  {
    path: '',
    title: 'Productos | SYSFAC',
    data: { title: 'Productos', breadcrumb: 'Productos' },
    loadComponent: () => import('./maestro-productos').then((m) => m.MaestroProductos),
  },
];

export default routes;
