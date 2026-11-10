import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Página temporal para las rutas preregistradas (stubs) de la oleada 1.
 * Recibe `title` desde `data` de la ruta (withComponentInputBinding).
 * Cada feature la reemplaza por su pantalla real en la Fase 4.
 */
@Component({
  selector: 'app-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6">
      <h1 class="text-2xl font-semibold">{{ title() }}</h1>
      <p class="mt-2 text-muted-color">Pantalla en construcción.</p>
    </section>
  `,
})
export class PlaceholderPage {
  readonly title = input('SYSFAC');
}
