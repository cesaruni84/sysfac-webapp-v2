import type { ActivatedRouteSnapshot } from '@angular/router';
import type { MenuItem } from 'primeng/api';

/**
 * Construye las migas de pan desde la raíz hasta la hoja a partir de `data.breadcrumb`
 * de la configuración de cada ruta. Los tramos sin `breadcrumb` se omiten (pero sus
 * segmentos de URL sí se acumulan en el `routerLink` de los siguientes).
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
      items.push({ label, routerLink: '/' + segmentos.join('/') });
    }
  }
  return items;
}
