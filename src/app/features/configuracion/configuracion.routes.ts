import { Routes } from '@angular/router';

/**
 * Rutas de la feature `configuracion` (maestros; montada en /forms/configuracion).
 *
 * Una subcarpeta por maestro, cada una con su `<maestro>.routes.ts` (title, data y pantalla).
 * Así 4.4 (factorias, choferes, vehiculos) y 4.5 (productos, clientes, tarifas) no comparten
 * archivos. Este archivo lo edita solo el orquestador.
 */
const routes: Routes = [
  { path: 'factorias', loadChildren: () => import('./factorias/factorias.routes') },
  { path: 'tarifas', loadChildren: () => import('./tarifas/tarifas.routes') },
  { path: 'choferes', loadChildren: () => import('./choferes/choferes.routes') },
  { path: 'vehiculos', loadChildren: () => import('./vehiculos/vehiculos.routes') },
  { path: 'productos', loadChildren: () => import('./productos/productos.routes') },
  { path: 'clientes', loadChildren: () => import('./clientes/clientes.routes') },
];

export default routes;
