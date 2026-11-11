import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';

import { SessionService } from '../../core/auth';
import type { Usuario } from '../../core/models';
import { crearMenuNegocio, filtrarMenuPorCargo } from '../../core/navigation';

/** Descripción breve por id de sección del menú (los textos son solo de presentación). */
const DESCRIPCIONES: Readonly<Record<string, string>> = {
  guias: 'Registra y consulta guías de remisión.',
  liquidacion: 'Registra y consulta liquidaciones.',
  facturacion: 'Emite, consulta y audita facturas.',
  configuracion: 'Administra plantas, tarifas, choferes, vehículos, productos y clientes.',
  usuarios: 'Revisa y edita tu perfil.',
  mapa: 'Ubica las unidades en el mapa.',
};

export interface AccesoEnlace {
  id: string;
  label: string;
  url: string | null;
}

export interface Acceso {
  id: string;
  label: string;
  icon: string;
  descripcion: string;
  /** Enlace propio de la sección (solo si no tiene subopciones). */
  url: string | null;
  enlaces: AccesoEnlace[];
}

function aEnlace(item: MenuItem): AccesoEnlace {
  const url = typeof item.routerLink === 'string' && !item.disabled ? item.routerLink : null;
  return { id: item.id ?? item.label ?? '', label: item.label ?? '', url };
}

/** Accesos de la portada a partir del menú de negocio (ya filtrado por cargo), sin "Principal". */
export function crearAccesos(menu: MenuItem[]): Acceso[] {
  return menu
    .filter((item) => item.id !== 'principal')
    .map((item) => {
      const hijos = item.items ?? [];
      return {
        id: item.id ?? item.label ?? '',
        label: item.label ?? '',
        icon: item.icon ?? 'pi pi-angle-right',
        descripcion: DESCRIPCIONES[item.id ?? ''] ?? '',
        url: hijos.length === 0 ? aEnlace(item).url : null,
        enlaces: hijos.map(aEnlace),
      };
    });
}

/** Nombre completo sin mostrar `null`/`undefined` si faltan nombres o apellidos. */
export function nombreCompleto(usuario: Usuario | null): string {
  if (!usuario) return '';
  return [usuario.nombres, usuario.apellidos]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/** Empresa de la sesión: razón social o nombre comercial, más RUC. */
export function empresaConRuc(usuario: Usuario | null): string {
  const empresa = usuario?.empresa;
  if (!empresa) return '';
  const nombre = empresa.razonSocial || empresa.comercial || '';
  return [nombre, empresa.ruc ? `RUC ${empresa.ruc}` : ''].filter(Boolean).join(' - ');
}

/** Página de inicio: bienvenida y accesos directos según el cargo (mismo menú que el sidebar). */
@Component({
  selector: 'app-inicio',
  imports: [CardModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (usuario(); as u) {
      <section class="mb-6" aria-labelledby="inicio-titulo">
        <h1 id="inicio-titulo" class="m-0 text-2xl font-semibold" data-testid="inicio-saludo">
          @if (nombre()) {
            Bienvenido, {{ nombre() }}
          } @else {
            Bienvenido
          }
        </h1>
        @if (empresa()) {
          <p class="mb-0 mt-1 text-muted-color" data-testid="inicio-empresa">{{ empresa() }}</p>
        }
        <p class="mb-0 mt-1 text-sm capitalize text-muted-color" data-testid="inicio-fecha">
          {{ fecha }}
        </p>
      </section>

      <section aria-label="Accesos directos">
        <ul class="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
          @for (a of accesos(); track a.id) {
            <li>
              <p-card styleClass="h-full">
                <div class="flex items-start gap-3">
                  <i [class]="a.icon + ' text-2xl text-primary'" aria-hidden="true"></i>
                  <div class="min-w-0 flex-1">
                    <h2 class="m-0 text-lg font-semibold">
                      @if (a.url) {
                        <a
                          [routerLink]="a.url"
                          class="rounded text-inherit no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >{{ a.label }}</a
                        >
                      } @else {
                        {{ a.label }}
                      }
                    </h2>
                    @if (a.descripcion) {
                      <p class="mb-0 mt-1 text-sm text-muted-color">{{ a.descripcion }}</p>
                    }
                    @if (a.enlaces.length) {
                      <ul class="mb-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                        @for (e of a.enlaces; track e.id) {
                          <li>
                            @if (e.url) {
                              <a
                                [routerLink]="e.url"
                                class="inline-block rounded-full border border-surface px-3 py-1 text-sm text-primary no-underline hover:bg-surface-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-surface-800"
                                >{{ e.label }}</a
                              >
                            } @else {
                              <span
                                class="inline-block rounded-full border border-surface px-3 py-1 text-sm text-muted-color opacity-60"
                                aria-disabled="true"
                                >{{ e.label }} (no disponible)</span
                              >
                            }
                          </li>
                        }
                      </ul>
                    }
                  </div>
                </div>
              </p-card>
            </li>
          }
        </ul>
      </section>
    } @else {
      <h1 class="text-2xl font-semibold">Principal</h1>
      <p role="alert" data-testid="inicio-sin-sesion">
        No hay una sesión activa. Inicia sesión para ver tus accesos.
      </p>
    }
  `,
})
export class Inicio {
  protected readonly usuario = inject(SessionService).usuarioActual;
  protected readonly nombre = computed(() => nombreCompleto(this.usuario()));
  protected readonly empresa = computed(() => empresaConRuc(this.usuario()));
  protected readonly accesos = computed(() =>
    crearAccesos(filtrarMenuPorCargo(crearMenuNegocio(), this.usuario()?.cargo)),
  );

  protected readonly fecha = new Intl.DateTimeFormat('es-PE', { dateStyle: 'full' }).format(
    new Date(),
  );
}
