import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

import { AuthService, SessionService } from '../../core/auth';
import type { Usuario } from '../../core/models';
import { ModoOscuroService } from '../tema/modo-oscuro.service';

/** Texto de empresa del header, como v1: `"<comercial> - RUC <ruc>"`. */
export function textoEmpresa(usuario: Usuario | null): string {
  const empresa = usuario?.empresa;
  if (!empresa) return '';
  const nombre = empresa.comercial || empresa.razonSocial || '';
  return empresa.ruc ? `${nombre} - RUC ${empresa.ruc}` : nombre;
}

/** Iniciales para el avatar (v1 mostraba una foto genérica `user.jpg`). */
export function iniciales(usuario: Usuario | null): string {
  if (!usuario) return '';
  const letras = [usuario.nombres, usuario.apellidos]
    .map((p) => (p ?? '').trim().charAt(0))
    .join('');
  return (letras || usuario.codigo?.charAt(0) || '?').toUpperCase();
}

/**
 * Barra superior (equivale a `app-header-side` de v1): botón de menú, empresa
 * (comercial y RUC), modo oscuro y menú de usuario con "Cerrar sesión".
 */
@Component({
  selector: 'app-layout-header',
  imports: [AvatarModule, ButtonModule, MenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex h-16 shrink-0 items-center gap-2 border-b border-surface bg-surface-0 px-2 sm:px-4 dark:bg-surface-900"
    >
      <span class="lg:hidden">
        <p-button
          icon="pi pi-bars"
          [text]="true"
          [rounded]="true"
          severity="secondary"
          ariaLabel="Abrir menú"
          (onClick)="abrirMenuMovil.emit()"
        />
      </span>
      <span class="hidden lg:inline-flex">
        <!-- Botón nativo con pButton: p-button no expone aria-expanded en PrimeNG 21. -->
        <button
          pButton
          type="button"
          [text]="true"
          [rounded]="true"
          severity="secondary"
          [attr.aria-label]="sidebarAbierto() ? 'Ocultar menú lateral' : 'Mostrar menú lateral'"
          [attr.aria-expanded]="sidebarAbierto()"
          (click)="alternarSidebar.emit()"
        >
          <i pButtonIcon class="pi pi-bars"></i>
        </button>
      </span>

      <span class="min-w-0 flex-1 truncate text-base sm:text-[17px]" data-testid="header-empresa">
        {{ empresa() }}
      </span>

      <p-button
        [icon]="modoOscuro.activo() ? 'pi pi-sun' : 'pi pi-moon'"
        [text]="true"
        [rounded]="true"
        severity="secondary"
        [ariaLabel]="modoOscuro.activo() ? 'Usar modo claro' : 'Usar modo oscuro'"
        (onClick)="modoOscuro.alternar()"
      />

      <button
        type="button"
        class="flex items-center gap-2 rounded-full p-1 hover:bg-surface-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:rounded-lg sm:pr-2 dark:hover:bg-surface-800"
        aria-label="Menú de usuario"
        aria-haspopup="menu"
        (click)="menuUsuario.toggle($event)"
      >
        <p-avatar
          [label]="iniciales()"
          shape="circle"
          styleClass="bg-primary text-primary-contrast"
          aria-hidden="true"
        />
        @if (usuario(); as u) {
          <span class="hidden text-left leading-tight md:block" data-testid="header-usuario">
            <span class="block text-sm font-medium">{{ u.nombres }} {{ u.apellidos }}</span>
            <span class="block text-xs text-muted-color">{{ u.cargo }}</span>
          </span>
        }
      </button>
      <p-menu
        #menuUsuario
        [model]="opcionesUsuario()"
        [popup]="true"
        appendTo="body"
        ariaLabel="Opciones de usuario"
      />
    </header>
  `,
})
export class LayoutHeader {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly modoOscuro = inject(ModoOscuroService);

  /** Estado del sidebar de escritorio (para el `aria-label`/`aria-expanded` del botón). */
  readonly sidebarAbierto = input(true);

  /** Botón de menú en escritorio (≥ lg): pliega o despliega el sidebar fijo. */
  readonly alternarSidebar = output<void>();
  /** Botón de menú en móvil (< lg): abre el drawer. */
  readonly abrirMenuMovil = output<void>();

  readonly usuario = inject(SessionService).usuarioActual;
  readonly empresa = computed(() => textoEmpresa(this.usuario()));
  readonly iniciales = computed(() => iniciales(this.usuario()));

  /** Menú de usuario: encabezado con el nombre (visible también en móvil) y "Cerrar sesión". */
  readonly opcionesUsuario = computed<MenuItem[]>(() => {
    const u = this.usuario();
    return [
      {
        label: u ? `${u.nombres} ${u.apellidos}`.trim() : 'Usuario',
        items: [
          { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() },
        ],
      },
    ];
  });

  /** Como v1 (`header-side.component.ts`): limpia la sesión y navega al login. */
  cerrarSesion(): void {
    this.auth.logout();
    void this.router.navigate(['/sessions/signin']);
  }
}
