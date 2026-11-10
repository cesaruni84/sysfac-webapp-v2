import type { MenuItem } from 'primeng/api';

/** `true` si `url` (con o sin query/fragment) es `enlace` o una subruta suya. */
export function coincideEnlace(enlace: unknown, url: string): boolean {
  if (typeof enlace !== 'string' || enlace.length === 0) return false;
  const ruta = url.split(/[?#]/)[0];
  return ruta === enlace || ruta.startsWith(enlace.endsWith('/') ? enlace : enlace + '/');
}

/**
 * Deja expandida solo la sección cuyo hijo coincide con `url` y pliega las demás
 * (equivale a `routerLinkActive="open"` del sidenav de v1). Muta `expanded` de las secciones
 * de `menu` (el modelo propio del sidebar, nunca `MENU_NEGOCIO`) y devuelve la sección activa.
 */
export function expandirSeccionActiva(menu: MenuItem[], url: string): MenuItem | undefined {
  let activa: MenuItem | undefined;
  for (const seccion of menu) {
    if (!seccion.items?.length) continue;
    const abierta = seccion.items.some((hijo) => coincideEnlace(hijo.routerLink, url));
    seccion.expanded = abierta;
    if (abierta) activa = seccion;
  }
  return activa;
}

/**
 * Asigna `command` a cada ítem con `routerLink` (cualquier nivel) para avisar que el usuario
 * eligió un enlace; el shell lo usa para cerrar el drawer móvil. Muta `menu`.
 */
export function alElegirEnlace(menu: MenuItem[], accion: () => void): MenuItem[] {
  for (const item of menu) {
    if (item.routerLink) item.command = () => accion();
    if (item.items) alElegirEnlace(item.items, accion);
  }
  return menu;
}
