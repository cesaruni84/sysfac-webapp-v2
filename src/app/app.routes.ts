import { Routes } from '@angular/router';

import { authGuard } from './core/auth';

/**
 * Rutas raíz de SYSFAC v2. Mantienen las mismas URLs que v1.
 *
 * Archivo compartido: solo lo edita el orquestador. Cada feature define sus
 * pantallas en `features/<modulo>/<modulo>.routes.ts` (export default).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sessions' },
  {
    // Zona pública (3.4): el layout aporta fondo, centrado y marca; cada página, su tarjeta.
    path: 'sessions',
    loadComponent: () => import('./layout/auth/auth-layout').then((m) => m.LayoutAuth),
    children: [
      {
        path: '404',
        title: 'Página no encontrada | SYSFAC',
        loadComponent: () =>
          import('./layout/paginas/no-encontrada/no-encontrada').then(
            (m) => m.PaginaNoEncontrada,
          ),
      },
      {
        path: 'error',
        title: 'Error | SYSFAC',
        loadComponent: () => import('./layout/paginas/error/error').then((m) => m.PaginaError),
      },
      {
        path: '',
        loadChildren: () => import('./features/auth/auth.routes'),
      },
    ],
  },
  {
    // Rutas privadas: igual que v1 (app.routing.ts), el guard va en la ruta padre.
    path: '',
    canActivate: [authGuard],
    // Layout de la zona privada (3.2), cargado de forma diferida.
    loadComponent: () => import('./layout/shell/shell').then((m) => m.LayoutShell),
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes'),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/usuarios/usuarios.routes'),
      },
      {
        path: 'map',
        loadChildren: () => import('./features/mapa/mapa.routes'),
      },
      {
        // Sin breadcrumb en `forms`: cada sección pone su propia miga (sin enlace,
        // porque no tiene pantalla; ver construirBreadcrumb en core/navigation).
        path: 'forms',
        children: [
          {
            path: 'facturacion',
            data: { breadcrumb: 'Facturación' },
            loadChildren: () => import('./features/facturacion/facturacion.routes'),
          },
          {
            path: 'configuracion',
            data: { breadcrumb: 'Configuración' },
            loadChildren: () => import('./features/configuracion/configuracion.routes'),
          },
          // Guías (basic, paging) y liquidación (liquidacion, busquedaLiquidaciones)
          // cuelgan directamente de /forms, igual que en v1.
          {
            path: '',
            data: { breadcrumb: 'Guías de Remisión' },
            loadChildren: () => import('./features/guias/guias.routes'),
          },
          {
            path: '',
            data: { breadcrumb: 'Liquidación' },
            loadChildren: () => import('./features/liquidacion/liquidacion.routes'),
          },
        ],
      },
    ],
  },
  // Igual que v1 (app.routing.ts): cualquier URL desconocida va a la 404.
  { path: '**', redirectTo: 'sessions/404' },
];
