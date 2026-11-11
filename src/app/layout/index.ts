/**
 * Layouts de la aplicación.
 * - Zona privada (3.2): `LayoutShell`.
 * - Zona pública `/sessions` (3.4): `LayoutAuth`, con las páginas `PaginaNoEncontrada` (404)
 *   y `PaginaError`.
 *
 * `app.routes.ts` los carga de forma diferida importando el archivo directo, no este índice,
 * para no arrastrar el resto al bundle inicial. Por ejemplo:
 * `loadComponent: () => import('./layout/shell/shell').then((m) => m.LayoutShell)`.
 */
export * from './auth/auth-layout';
export * from './breadcrumb/breadcrumb';
export * from './paginas/error/error';
export * from './paginas/no-encontrada/no-encontrada';
export * from './header/header';
export * from './shell/shell';
export * from './sidebar/sidebar';
export * from './tema/modo-oscuro.service';
