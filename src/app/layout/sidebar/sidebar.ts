import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { filter, map } from 'rxjs';

import { SessionService } from '../../core/auth';
import { crearMenuNegocio, filtrarMenuPorCargo } from '../../core/navigation';
import { alElegirEnlace, expandirSeccionActiva } from './menu-activo';

/**
 * Contenido del menú lateral (equivale a `app-sidebar-side` + `app-sidenav` de v1):
 * logo, datos del usuario (código, nombre y cargo, como v1) y el menú de negocio con
 * `p-panelmenu`. Se usa dentro del `aside` de escritorio y del `p-drawer` móvil.
 *
 * - Modelo propio: `crearMenuNegocio()` (copia; `p-panelmenu` muta `expanded`), filtrado por
 *   cargo como v1 (el cargo "Registrador" no ve Facturación).
 * - En cada `NavigationEnd` deja abierta solo la sección que contiene la URL actual.
 * - El ítem activo se resalta con la clase `p-panelmenu-item-link-active` de PrimeNG.
 */
@Component({
  selector: 'app-layout-sidebar',
  imports: [PanelMenuModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  styles: `
    :host {
      --p-panelmenu-gap: 0.125rem;
      --p-panelmenu-panel-border-color: transparent;
      --p-panelmenu-panel-background: transparent;
    }
    :host ::ng-deep .p-panelmenu-item-link-active,
    :host ::ng-deep .p-panelmenu-header-link.p-panelmenu-item-link-active {
      color: var(--p-primary-color);
      font-weight: 600;
      border-radius: var(--p-content-border-radius);
      background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
    }
    :host ::ng-deep .p-panelmenu-item-link-active :is(.p-panelmenu-item-icon, .p-panelmenu-header-icon) {
      color: var(--p-primary-color);
    }
  `,
  template: `
    <div class="flex flex-col items-center gap-3 px-4 pb-4 pt-5">
      <a
        routerLink="/dashboard"
        class="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        (click)="enlaceSeleccionado.emit()"
      >
        <img src="assets/images/logo-sysfac.png" alt="SYSFAC - Inicio" width="100" />
      </a>
      @if (usuario(); as u) {
        <div class="text-center text-sm leading-snug" data-testid="sidebar-usuario">
          <div class="font-medium">{{ u.codigo }} - {{ u.nombres }} {{ u.apellidos }}</div>
          <div class="mt-1 text-muted-color">
            <i class="pi pi-lock text-xs" aria-hidden="true"></i>
            <b class="ml-1">{{ u.cargo }}</b>
          </div>
        </div>
      }
    </div>
    <nav aria-label="Menú principal" class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
      <p-panelmenu [model]="modelo()" styleClass="w-full" />
    </nav>
  `,
})
export class LayoutSidebar {
  private readonly router = inject(Router);

  /** Se emite cuando el usuario elige un enlace (el shell cierra el drawer móvil). */
  readonly enlaceSeleccionado = output<void>();

  readonly usuario = inject(SessionService).usuarioActual;

  /** Copia propia del menú; `p-panelmenu` muta sus `expanded`. */
  private readonly menu: MenuItem[] = alElegirEnlace(
    filtrarMenuPorCargo(crearMenuNegocio(), this.usuario()?.cargo),
    () => this.enlaceSeleccionado.emit(),
  );

  /** Modelo de `p-panelmenu`: arreglo nuevo en cada navegación para que se repinte (OnPush). */
  readonly modelo = signal<MenuItem[]>(this.menu);

  /** Sección abierta por la URL actual (útil para pruebas y depuración). */
  readonly seccionActiva = computed(() => this.modelo().find((s) => s.expanded)?.id);

  constructor() {
    this.sincronizar(this.router.url);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects),
        takeUntilDestroyed(),
      )
      .subscribe((url) => this.sincronizar(url));
  }

  private sincronizar(url: string): void {
    expandirSeccionActiva(this.menu, url);
    this.modelo.set([...this.menu]);
  }
}
