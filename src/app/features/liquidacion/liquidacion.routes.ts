import { Routes } from '@angular/router';

/**
 * Rutas de la feature `liquidacion` (registro y consulta de liquidaciones; montada en /forms).
 * STUB de la oleada 1: cada ruta muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: 'liquidacion',
    title: 'Registro de liquidación | SYSFAC',
    data: { title: 'Registro de liquidación', breadcrumb: 'Registro' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'busquedaLiquidaciones',
    title: 'Consulta de liquidaciones | SYSFAC',
    data: { title: 'Consulta de liquidaciones', breadcrumb: 'Consulta' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
];

export default routes;
