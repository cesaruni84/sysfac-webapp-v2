import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

/** Ancho por defecto: 840px, como los popups CRUD de v1 (`width: '840px'`). */
export const ANCHO_DIALOGO_CRUD = '52.5rem';

/** Breakpoints responsive del diálogo (ancho de pantalla → ancho del diálogo). */
export const BREAKPOINTS_DIALOGO_CRUD = { '960px': '90vw', '640px': '100vw' } as const;

/**
 * Diálogo modal para formularios de alta/edición (reemplaza los `*-popup` con `MatDialog` de v1).
 *
 * - El contenido (el formulario de la pantalla) se proyecta.
 * - Botones Guardar/Cancelar en el pie. "Guardar" solo emite `(guardar)`: la pantalla valida,
 *   llama al servicio y cierra con `visible.set(false)` cuando el backend responde.
 * - `guardando`: deshabilita los botones, muestra spinner en "Guardar" e impide cerrar.
 * - Cancelar, la X o Escape cierran el diálogo (`visible` → `false`) y emiten `(cancelar)`.
 *
 * ```html
 * <app-dialogo-crud
 *   [(visible)]="dialogoVisible"
 *   [titulo]="esNuevo() ? 'Nuevo Chofer' : 'Actualizar Chofer'"
 *   [guardando]="guardando()"
 *   [guardarDeshabilitado]="form.invalid"
 *   (guardar)="guardar()"
 * >
 *   <form [formGroup]="form" (ngSubmit)="guardar()">...</form>
 * </app-dialogo-crud>
 * ```
 */
@Component({
  selector: 'app-dialogo-crud',
  imports: [DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="alCambiarVisible($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!guardando()"
      [closeOnEscape]="!guardando()"
      [blockScroll]="true"
      [style]="{ width: ancho() }"
      [breakpoints]="breakpoints"
      closeAriaLabel="Cerrar"
    >
      <ng-template #header>
        <span class="flex items-center gap-2 text-lg font-semibold" data-testid="titulo-dialogo">
          @if (icono()) {
            <i [class]="icono()" aria-hidden="true"></i>
          }
          {{ titulo() }}
        </span>
      </ng-template>

      <ng-content />

      <ng-template #footer>
        <p-button
          [label]="textoCancelar()"
          severity="secondary"
          [outlined]="true"
          [disabled]="guardando()"
          (onClick)="cancelarDialogo()"
          data-testid="boton-cancelar"
        />
        <p-button
          [label]="textoGuardar()"
          icon="pi pi-check"
          [loading]="guardando()"
          [disabled]="guardarDeshabilitado() || guardando()"
          (onClick)="guardar.emit()"
          data-testid="boton-guardar"
        />
      </ng-template>
    </p-dialog>
  `,
})
export class DialogoCrud {
  /** Visibilidad del diálogo (`[(visible)]`). */
  readonly visible = model(false);
  readonly titulo = input.required<string>();
  /** Clase de PrimeIcons junto al título (opcional), p. ej. `'pi pi-user'`. */
  readonly icono = input<string>();
  /** Ancho en escritorio (CSS). En pantallas pequeñas se ajusta con `BREAKPOINTS_DIALOGO_CRUD`. */
  readonly ancho = input(ANCHO_DIALOGO_CRUD);
  /** Guardado en curso: spinner en "Guardar", botones deshabilitados y sin cierre. */
  readonly guardando = input(false);
  /** Deshabilita "Guardar" (típicamente `form.invalid`). */
  readonly guardarDeshabilitado = input(false);
  readonly textoGuardar = input('Guardar');
  readonly textoCancelar = input('Cancelar');

  /** Clic en "Guardar". */
  readonly guardar = output<void>();
  /** El usuario cerró sin guardar (Cancelar, X o Escape). */
  readonly cancelar = output<void>();

  protected readonly breakpoints = BREAKPOINTS_DIALOGO_CRUD;

  protected alCambiarVisible(visible: boolean): void {
    if (visible) {
      this.visible.set(true);
    } else {
      this.cancelarDialogo();
    }
  }

  protected cancelarDialogo(): void {
    if (this.guardando() || !this.visible()) return;
    this.visible.set(false);
    this.cancelar.emit();
  }
}
