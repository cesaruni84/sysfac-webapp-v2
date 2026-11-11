import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

/** Página 404 (referencia funcional: v1 `views/sessions/not-found`). Se muestra dentro de `LayoutAuth`. */
@Component({
  selector: 'app-pagina-no-encontrada',
  imports: [ButtonModule, CardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full max-w-md' },
  template: `
    <p-card>
      <div class="flex flex-col items-center gap-3 text-center">
        <i class="pi pi-exclamation-circle text-5xl text-red-500" aria-hidden="true"></i>
        <h1 class="m-0 text-5xl font-bold">404</h1>
        <p class="m-0 text-lg">Página no encontrada</p>
        <p-button label="Volver al inicio" icon="pi pi-home" (onClick)="volver()" />
      </div>
    </p-card>
  `,
})
export class PaginaNoEncontrada {
  private readonly router = inject(Router);

  volver(): void {
    void this.router.navigate(['/dashboard']);
  }
}
