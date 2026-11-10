import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ConfirmacionService, ICONO_CONFIRMACION_PELIGRO } from './confirmacion.service';

/**
 * Host del diálogo de confirmación: un `p-confirmdialog` conectado a `ConfirmacionService`.
 * Se monta **una sola vez** en el shell: `<app-confirmacion-host />`.
 *
 * El mensaje se pinta con interpolación (texto plano): `p-confirmdialog` por defecto usa
 * `innerHTML`, y los mensajes suelen incluir datos del usuario.
 */
@Component({
  selector: 'app-confirmacion-host',
  imports: [ConfirmDialogModule],
  providers: [
    { provide: ConfirmationService, useFactory: () => inject(ConfirmacionService).canal },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmdialog [style]="{ width: '27.5rem' }" [breakpoints]="{ '640px': '95vw' }">
      <ng-template #message let-confirmacion>
        <div class="flex items-start gap-3">
          <i
            [class]="
              confirmacion?.icon +
              (confirmacion?.icon === iconoPeligro ? ' text-red-500' : ' text-primary') +
              ' text-2xl'
            "
            aria-hidden="true"
          ></i>
          <p class="m-0" data-testid="mensaje-confirmacion">{{ confirmacion?.message }}</p>
        </div>
      </ng-template>
    </p-confirmdialog>
  `,
})
export class ConfirmacionHost {
  protected readonly iconoPeligro = ICONO_CONFIRMACION_PELIGRO;
}
