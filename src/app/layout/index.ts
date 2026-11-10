/**
 * Layout de la zona privada (tarea 3.2).
 *
 * `LayoutShell` se carga de forma diferida desde `app.routes.ts`:
 * `loadComponent: () => import('./layout/shell/shell').then((m) => m.LayoutShell)`
 * (se importa el archivo directo, no este índice, para no arrastrar el resto al bundle inicial).
 */
export * from './breadcrumb/breadcrumb';
export * from './header/header';
export * from './shell/shell';
export * from './sidebar/sidebar';
export * from './tema/modo-oscuro.service';
