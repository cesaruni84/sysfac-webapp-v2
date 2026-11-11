import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

/** Página de error (referencia funcional: v1 `views/sessions/error`). Se muestra dentro de `LayoutAuth`. */
@Component({
  selector: 'app-pagina-error',
  imports: [ButtonModule, CardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full max-w-md' },
  template: `
    <p-card>
      <div class="flex flex-col items-center gap-3 text-center">
        <i class="pi pi-exclamation-triangle text-5xl text-red-500" aria-hidden="true"></i>
        <h1 class="m-0 text-5xl font-bold">500</h1>
        <p class="m-0 text-lg">Error del servidor</p>
        <p-button label="Volver al inicio" icon="pi pi-home" (onClick)="volver()" />
      </div>
    </p-card>
  `,
})
export class PaginaError {
  private readonly router = inject(Router);

  volver(): void {
    void this.router.navigate(['/dashboard']);
  }
}
