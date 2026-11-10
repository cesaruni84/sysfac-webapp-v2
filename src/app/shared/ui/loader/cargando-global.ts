import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { CargaGlobalService } from '../../../core/carga';

/**
 * Overlay de carga global (equivalente visual de `app-loader` de v1): bloquea la pantalla con un
 * spinner y el mensaje de `CargaGlobalService` mientras haya aperturas activas.
 *
 * Se monta **una sola vez** en el shell: `<app-cargando-global />`. Las pantallas no lo usan
 * directamente: llaman a `CargaGlobalService.abrir()/cerrar()/ejecutar()` (core).
 */
@Component({
  selector: 'app-cargando-global',
  imports: [ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (carga.activo()) {
      <div
        class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40"
        role="alertdialog"
        aria-modal="true"
        aria-busy="true"
        [attr.aria-label]="carga.mensaje()"
        data-testid="cargando-global"
      >
        <div
          class="flex w-52 flex-col items-center gap-3 rounded-lg bg-surface-0 p-5 shadow-lg dark:bg-surface-900"
        >
          <span class="text-center font-medium" data-testid="mensaje-cargando-global">{{
            carga.mensaje()
          }}</span>
          <p-progressspinner
            [style]="{ width: '3.5rem', height: '3.5rem' }"
            strokeWidth="4"
            [ariaLabel]="carga.mensaje()"
          />
        </div>
      </div>
    }
  `,
})
export class CargandoGlobal {
  protected readonly carga = inject(CargaGlobalService);
}
