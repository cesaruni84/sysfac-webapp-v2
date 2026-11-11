import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ModoOscuroService } from '../tema/modo-oscuro.service';

/**
 * Layout de la zona pública (`/sessions/**`): fondo a pantalla completa, contenido centrado,
 * marca "SYSFAC" arriba y pie discreto. No aporta tarjeta: las páginas hijas llevan la suya.
 */
@Component({
  selector: 'app-layout-auth',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface-100 px-4 py-8 dark:bg-surface-950"
    >
      <p class="text-4xl font-bold tracking-widest text-primary" data-testid="marca">SYSFAC</p>
      <main class="flex w-full flex-col items-center">
        <router-outlet />
      </main>
      <footer class="text-sm text-muted-color">&copy; SYSFAC</footer>
    </div>
  `,
})
export class LayoutAuth {
  constructor() {
    // Aplica la preferencia de modo oscuro guardada también en la zona pública.
    inject(ModoOscuroService);
  }
}
