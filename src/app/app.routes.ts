import { Routes } from '@angular/router';

import { authGuard } from './core/auth';

/**
 * Rutas raíz de SYSFAC v2. Mantienen las mismas URLs que v1.
 *
 * Archivo compartido: solo lo edita el orquestador. Cada feature define sus
 * pantallas en `features/<modulo>/<modulo>.routes.ts` (export default).
 *
 * Pendiente en oleadas posteriores:
 * - 3.2: envolver las rutas privadas con el componente de layout (shell).
 * - 3.4: páginas 404 y de error (la ruta comodín apuntará a la 404).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sessions' },
  {
    path: 'sessions',
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  {
    // Rutas privadas: igual que v1 (app.routing.ts), el guard va en la ruta padre.
    path: '',
    canActivate: [authGuard],
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
        path: 'forms',
        children: [
          {
            path: 'facturacion',
            loadChildren: () => import('./features/facturacion/facturacion.routes'),
          },
          {
            path: 'configuracion',
            loadChildren: () => import('./features/configuracion/configuracion.routes'),
          },
          // Guías (basic, paging) y liquidación (liquidacion, busquedaLiquidaciones)
          // cuelgan directamente de /forms, igual que en v1.
          {
            path: '',
            loadChildren: () => import('./features/guias/guias.routes'),
          },
          {
            path: '',
            loadChildren: () => import('./features/liquidacion/liquidacion.routes'),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'sessions' },
];
