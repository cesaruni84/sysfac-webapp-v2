import type { ActivatedRouteSnapshot } from '@angular/router';
import type { MenuItem } from 'primeng/api';

/**
 * Construye las migas de pan desde la raíz hasta la hoja a partir de `data.breadcrumb`
 * de la configuración de cada ruta. Los tramos sin `breadcrumb` se omiten (pero sus
 * segmentos de URL sí se acumulan en el `routerLink` de los siguientes).
 *
 * Una miga solo lleva `routerLink` si su tramo pinta una pantalla (`component` o
 * `loadComponent`); los tramos de solo `loadChildren`/`children` salen como texto.
 *
 * Diferencias con v1: no sustituye `{{param}}` como `parseText` de v1 (ninguna ruta tiene
 * parámetros hoy), y la miga de Auditoría decía "FACTURA CON ERRORES" y ahora "Auditoría"
 * (igual que el menú).
 *
 * Se lee `routeConfig.data` y no `snapshot.data` para no heredar la miga del padre.
 */
export function construirBreadcrumb(snapshot: ActivatedRouteSnapshot): MenuItem[] {
  const items: MenuItem[] = [];
  const segmentos: string[] = [];
  for (const tramo of snapshot.pathFromRoot) {
    segmentos.push(...tramo.url.map((s) => s.path));
    const label: unknown = tramo.routeConfig?.data?.['breadcrumb'];
    if (typeof label === 'string' && label.length > 0) {
      const navegable = !!(tramo.routeConfig?.component || tramo.routeConfig?.loadComponent);
      items.push(navegable ? { label, routerLink: '/' + segmentos.join('/') } : { label });
    }
  }
  return items;
}
