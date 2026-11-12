import { Routes } from '@angular/router';

/**
 * Rutas de la feature `facturacion` (registro, consulta y auditoría de facturas; montada en /forms/facturacion).
 * STUB de la oleada 1: cada ruta muestra PlaceholderPage hasta que se implemente la pantalla.
 */
const routes: Routes = [
  {
    path: 'registro',
    title: 'Registro de factura | SYSFAC',
    data: { title: 'Registro de factura', breadcrumb: 'Registro' },
    loadComponent: () =>
      import('../../shared/ui/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'consulta',
    title: 'Consulta de facturas | SYSFAC',
    data: { title: 'Consulta de facturas', breadcrumb: 'Consulta' },
    loadComponent: () => import('./consulta/consulta-facturas').then((m) => m.ConsultaFacturas),
  },
  {
    path: 'auditoria',
    title: 'Auditoría de facturas | SYSFAC',
    data: { title: 'Auditoría de facturas', breadcrumb: 'Auditoría' },
    loadComponent: () => import('./auditoria/auditoria-facturas').then((m) => m.AuditoriaFacturas),
  },
];

export default routes;
