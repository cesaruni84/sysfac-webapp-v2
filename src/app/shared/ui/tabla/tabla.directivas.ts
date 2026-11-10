import { Directive, Pipe, PipeTransform, TemplateRef, inject, input } from '@angular/core';

import { formatearCelda, tagCelda } from './tabla.formato';
import type { ColumnaTabla, ContextoCeldaTabla, ContextoDetalleTabla, ValorTag } from './tabla.types';

/**
 * Plantilla de celda para la columna cuyo `id` (o `campo`) coincide con el valor de la directiva.
 * `[tipar]` es opcional y solo sirve para tipar `let-fila` (pásale el mismo arreglo de filas).
 *
 * ```html
 * <ng-template appTablaCelda="estado" [tipar]="guias()" let-fila let-valor="valor" let-i="indice">
 *   <p-tag [value]="fila.estado" />
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[appTablaCelda]' })
export class TablaCelda<T> {
  /** `id` o `campo` de la columna. */
  readonly appTablaCelda = input.required<string>();
  /** Solo para inferir el tipo de `let-fila`. */
  readonly tipar = input<readonly T[] | null | undefined>();
  readonly plantilla = inject<TemplateRef<ContextoCeldaTabla<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: TablaCelda<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- solo se usa en el predicado de tipo
    ctx: unknown,
  ): ctx is ContextoCeldaTabla<T> {
    return true;
  }
}

/**
 * Plantilla de la fila de detalle expandible. Su presencia agrega la columna con el botón
 * de expandir. Requiere que las filas tengan una clave única (input `clave` de la tabla).
 *
 * ```html
 * <ng-template appTablaDetalle [tipar]="facturas()" let-factura>
 *   <app-detalle-factura [factura]="factura" />
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[appTablaDetalle]' })
export class TablaDetalle<T> {
  /** Solo para inferir el tipo de `let-fila`. */
  readonly tipar = input<readonly T[] | null | undefined>();
  readonly plantilla = inject<TemplateRef<ContextoDetalleTabla<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: TablaDetalle<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- solo se usa en el predicado de tipo
    ctx: unknown,
  ): ctx is ContextoDetalleTabla<T> {
    return true;
  }
}

/** Texto formateado de una celda (pipe puro: se recalcula solo si cambia la fila o la columna). */
@Pipe({ name: 'tablaCelda' })
export class TablaCeldaPipe implements PipeTransform {
  transform<T>(fila: T, columna: ColumnaTabla<T>, locale: string): string {
    return formatearCelda(fila, columna, locale);
  }
}

/** Tag de una celda `tag`. */
@Pipe({ name: 'tablaTag' })
export class TablaTagPipe implements PipeTransform {
  transform<T>(fila: T, columna: ColumnaTabla<T>): ValorTag | null {
    return tagCelda(fila, columna);
  }
}
