import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/** Tamaño del indicador inline. */
export type TamanoCargando = 'pequeno' | 'normal' | 'grande';

const DIAMETRO: Record<TamanoCargando, string> = {
  pequeno: '1.5rem',
  normal: '2.5rem',
  grande: '4rem',
};

/**
 * Indicador de carga **inline** para una sección o un bloque de la pantalla.
 * (Para la tabla genérica basta con su input `cargando`).
 *
 * ```html
 * @if (cargandoClientes()) {
 *   <app-cargando mensaje="Cargando clientes" />
 * } @else { ... }
 * ```
 */
@Component({
  selector: 'app-cargando',
  imports: [ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    'aria-live': 'polite',
    class: 'flex items-center justify-center gap-3 p-4 text-muted-color',
    '[class.flex-col]': 'vertical()',
  },
  template: `
    <p-progressspinner
      [style]="{ width: diametro(), height: diametro() }"
      strokeWidth="4"
      [ariaLabel]="mensaje() || 'Cargando'"
    />
    @if (mensaje()) {
      <span class="text-sm" data-testid="mensaje-cargando">{{ mensaje() }}</span>
    }
  `,
})
export class Cargando {
  /** Texto bajo/junto al spinner (opcional). */
  readonly mensaje = input('');
  readonly tamano = input<TamanoCargando>('normal');
  /** Spinner arriba y texto debajo (por defecto, en fila). */
  readonly vertical = input(false);

  protected readonly diametro = computed(() => DIAMETRO[this.tamano()]);
}
