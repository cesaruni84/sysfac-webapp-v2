import { Routes } from '@angular/router';

/**
 * Rutas de la feature `configuracion` (maestros; montada en /forms/configuracion).
 * STUB de la oleada 1: cada ruta muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: 'factorias',
    title: 'Plantas | SYSFAC',
    data: { title: 'Plantas', breadcrumb: 'Plantas' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'tarifas',
    title: 'Tarifas | SYSFAC',
    data: { title: 'Tarifas', breadcrumb: 'Tarifas' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'choferes',
    title: 'Choferes | SYSFAC',
    data: { title: 'Choferes', breadcrumb: 'Choferes' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'vehiculos',
    title: 'Vehículos | SYSFAC',
    data: { title: 'Vehículos', breadcrumb: 'Vehículos' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'productos',
    title: 'Productos | SYSFAC',
    data: { title: 'Productos', breadcrumb: 'Productos' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'clientes',
    title: 'Clientes | SYSFAC',
    data: { title: 'Clientes', breadcrumb: 'Clientes' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
