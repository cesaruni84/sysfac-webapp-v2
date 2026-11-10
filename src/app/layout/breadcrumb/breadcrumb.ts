import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { filter } from 'rxjs';

import { construirBreadcrumb } from '../../core/navigation';

/** URL de inicio: el icono "home" del breadcrumb apunta aquí. */
export const URL_INICIO = '/dashboard';

/** Hoja (ruta más profunda del outlet primario) del árbol de rutas. */
export function hojaDeRuta(raiz: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let hoja = raiz;
  while (hoja.firstChild) hoja = hoja.firstChild;
  return hoja;
}

/**
 * Ajusta las migas de `construirBreadcrumb` para `p-breadcrumb`:
 * - en la página de inicio no hay migas (el icono de inicio ya la representa);
 * - la última miga es la página actual y no lleva enlace.
 */
export function ajustarMigas(items: MenuItem[], url: string): MenuItem[] {
  const ruta = url.split(/[?#]/)[0];
  if (ruta === URL_INICIO || ruta === URL_INICIO + '/') return [];
  return items.map((item, i) => {
    if (i < items.length - 1) return item;
    // Sin `routerLink`: la última miga se ve como texto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { routerLink, ...resto } = item;
    return resto;
  });
}

/**
 * Breadcrumb del layout (equivale a `app-breadcrumb` de v1, modo `title`).
 *
 * Las migas salen de `data.breadcrumb` de cada ruta (ver `construirBreadcrumb` en
 * `core/navigation`). Para que una pantalla aparezca en el breadcrumb basta con poner
 * `data: { breadcrumb: 'Texto' }` en su ruta; no hay API que llamar desde la pantalla.
 */
@Component({
  selector: 'app-layout-breadcrumb',
  imports: [BreadcrumbModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Ruta de navegación">
      <p-breadcrumb
        [home]="home"
        [model]="migas().length ? migas() : undefined"
        homeAriaLabel="Inicio"
        styleClass="bg-transparent px-0 py-2"
      />
    </nav>
  `,
})
export class LayoutBreadcrumb {
  private readonly router = inject(Router);

  readonly home: MenuItem = { icon: 'pi pi-home', routerLink: URL_INICIO };

  /** Migas de la ruta actual (vacío en la página de inicio). */
  readonly migas = signal<MenuItem[]>([]);

  constructor() {
    this.actualizar();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.actualizar());
  }

  private actualizar(): void {
    const hoja = hojaDeRuta(this.router.routerState.snapshot.root);
    this.migas.set(ajustarMigas(construirBreadcrumb(hoja), this.router.url));
  }
}
