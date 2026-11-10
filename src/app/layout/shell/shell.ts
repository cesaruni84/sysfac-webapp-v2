import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { filter } from 'rxjs';

import { NotificacionService } from '../../core/notifications';
import { LayoutBreadcrumb } from '../breadcrumb/breadcrumb';
import { LayoutHeader } from '../header/header';
import { LayoutSidebar } from '../sidebar/sidebar';
import { ModoOscuroService } from '../tema/modo-oscuro.service';

/** Breakpoint `lg` de Tailwind (64rem): desde aquí el sidebar es fijo; por debajo, drawer. */
export const MEDIA_ESCRITORIO = '(min-width: 64rem)';

/** Duración de los toasts globales (ms). */
export const DURACION_TOAST = 5000;

/**
 * Shell de la zona privada: sidebar + header + breadcrumb + `<router-outlet>` y `p-toast` global.
 * Es el `component` (diferido) de la ruta padre con `canActivate: [authGuard]`.
 *
 * - Escritorio (≥ lg): sidebar fijo a la izquierda, plegable desde el header.
 * - Móvil (< lg): el sidebar va en un `p-drawer` que abre el botón del header y se cierra al
 *   elegir un enlace, al navegar o al pasar a escritorio.
 * - Toast: provee `MessageService` y muestra cada aviso de `NotificacionService` (core).
 */
@Component({
  selector: 'app-layout-shell',
  imports: [RouterOutlet, DrawerModule, ToastModule, LayoutBreadcrumb, LayoutHeader, LayoutSidebar],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-dvh' },
  template: `
    <a
      href="#contenido"
      class="sr-only z-50 rounded bg-surface-0 px-3 py-2 focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:outline-2 focus:outline-primary"
      (click)="irAlContenido($event)"
      >Saltar al contenido</a
    >
    <p-toast position="top-right" [preventOpenDuplicates]="true" [life]="duracionToast" />

    <div class="flex h-full overflow-hidden">
      @if (sidebarAbierto()) {
        <aside
          class="hidden w-64 shrink-0 flex-col border-r border-surface bg-surface-0 lg:flex dark:bg-surface-900"
          data-testid="sidebar-escritorio"
        >
          <app-layout-sidebar />
        </aside>
      }

      <p-drawer
        [(visible)]="drawerVisible"
        position="left"
        ariaCloseLabel="Cerrar menú"
        styleClass="w-72"
      >
        <!-- Plantilla #content: el sidebar móvil solo se crea mientras el drawer está abierto. -->
        <ng-template #content>
          <app-layout-sidebar (enlaceSeleccionado)="drawerVisible.set(false)" />
        </ng-template>
      </p-drawer>

      <div class="flex min-w-0 flex-1 flex-col">
        <app-layout-header
          [sidebarAbierto]="sidebarAbierto()"
          (alternarSidebar)="sidebarAbierto.set(!sidebarAbierto())"
          (abrirMenuMovil)="drawerVisible.set(true)"
        />
        <main id="contenido" tabindex="-1" class="min-h-0 flex-1 overflow-auto px-3 pb-6 sm:px-6">
          <app-layout-breadcrumb />
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class LayoutShell {
  private readonly mensajes = inject(MessageService);
  private readonly documento = inject(DOCUMENT);

  readonly duracionToast = DURACION_TOAST;

  /** Sidebar fijo de escritorio visible (plegable desde el header). */
  readonly sidebarAbierto = signal(true);
  /** Drawer móvil abierto. */
  readonly drawerVisible = signal(false);

  constructor() {
    // Aplica la preferencia de modo oscuro guardada al entrar a la zona privada.
    inject(ModoOscuroService);

    inject(NotificacionService)
      .notificaciones$.pipe(takeUntilDestroyed())
      .subscribe((n) =>
        this.mensajes.add({ severity: n.severidad, summary: n.titulo, detail: n.detalle }),
      );

    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.drawerVisible.set(false));

    inject(BreakpointObserver)
      .observe(MEDIA_ESCRITORIO)
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        if (matches) this.drawerVisible.set(false);
      });
  }

  /** Lleva el foco al contenido principal (enlace "Saltar al contenido"). */
  irAlContenido(evento: Event): void {
    evento.preventDefault();
    this.documento.getElementById('contenido')?.focus();
  }
}
