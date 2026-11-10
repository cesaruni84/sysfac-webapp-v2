import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  TemplateRef,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FilterMetadata } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule, type TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { claseAlineacion, formatearValor, idColumna, resolverCampo } from './tabla.formato';
import { TablaCelda, TablaCeldaPipe, TablaDetalle, TablaTagPipe } from './tabla.directivas';
import type {
  AccionTabla,
  ColumnaTabla,
  ContextoCeldaTabla,
  EventoAccionTabla,
  EventoCargaTabla,
  EventoExportarTabla,
  FormatoExportacion,
  TotalesTabla,
} from './tabla.types';

/** Filas por página por defecto (v1: `[limit]="10"` en ngx-datatable). */
export const FILAS_POR_PAGINA = 10;
export const OPCIONES_FILAS_POR_PAGINA = [5, 10, 25, 50] as const;
export const MENSAJE_TABLA_VACIA = 'No se encontraron registros.';

const ETIQUETA_EXPORTAR: Record<FormatoExportacion, { texto: string; icono: string }> = {
  excel: { texto: 'Exportar a Excel', icono: 'pi pi-file-excel' },
  pdf: { texto: 'Exportar a PDF', icono: 'pi pi-file-pdf' },
};

/**
 * Tabla genérica sobre `p-table` (reemplaza las grillas `ngx-datatable` de v1).
 * API y ejemplos completos en `shared/ui/README.md`.
 */
@Component({
  selector: 'app-tabla',
  imports: [
    NgTemplateOutlet,
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    TablaCeldaPipe,
    TablaTagPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="mb-2 flex flex-wrap items-center gap-2 empty:hidden" data-testid="barra-tabla">
      @if (buscador()) {
        <p-iconfield class="w-full sm:w-72">
          <p-inputicon class="pi pi-search" />
          <input
            pInputText
            type="search"
            class="w-full"
            [placeholder]="textoBuscador()"
            [attr.aria-label]="textoBuscador()"
            [value]="busqueda()"
            (input)="buscar(valorDe($event))"
            data-testid="buscador-tabla"
          />
        </p-iconfield>
      }
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <ng-content select="[appTablaBarra]" />
        @for (formato of formatosExportacion(); track formato) {
          <p-button
            [label]="etiquetaExportar[formato].texto"
            [icon]="etiquetaExportar[formato].icono"
            severity="secondary"
            [outlined]="true"
            size="small"
            [disabled]="cargando()"
            (onClick)="emitirExportar(formato)"
            [attr.data-testid]="'exportar-' + formato"
          />
        }
      </div>
    </div>

    <p-table
      #dt
      [value]="valor()"
      [dataKey]="clave()"
      [lazy]="lazy()"
      [totalRecords]="lazy() ? (totalRegistros() ?? 0) : 0"
      [paginator]="paginado()"
      [rows]="filasPorPagina()"
      [rowsPerPageOptions]="opcionesFilasPorPagina()"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="{first} - {last} de {totalRecords}"
      [globalFilterFields]="camposBusqueda()"
      [filterDelay]="retardoFiltro()"
      [loading]="cargando()"
      [selectionMode]="modoSeleccion() === 'simple' ? 'single' : null"
      [metaKeySelection]="false"
      [selection]="seleccionTabla()"
      (selectionChange)="alCambiarSeleccion($event)"
      [rowHover]="true"
      [stripedRows]="true"
      size="small"
      [tableStyle]="{ 'min-width': anchoMinimo() }"
      (onLazyLoad)="alCargar($event)"
    >
      <ng-template #header>
        <tr>
          @if (detalle()) {
            <th class="w-12"><span class="sr-only">Detalle</span></th>
          }
          @if (modoSeleccion() === 'multiple') {
            <th class="w-12"><p-tableHeaderCheckbox /></th>
          }
          @if (acciones().length && posicionAcciones() === 'inicio') {
            <th class="whitespace-nowrap">{{ tituloAcciones() }}</th>
          }
          @for (col of columnas(); track $index) {
            @if (col.ordenable !== false) {
              <th
                [pSortableColumn]="col.campo"
                [style.width]="col.ancho"
                [class]="alinear(col)"
                class="whitespace-nowrap"
              >
                {{ col.titulo }} <p-sortIcon [field]="col.campo" />
              </th>
            } @else {
              <th [style.width]="col.ancho" [class]="alinear(col)" class="whitespace-nowrap">
                {{ col.titulo }}
              </th>
            }
          }
          @if (acciones().length && posicionAcciones() === 'fin') {
            <th class="whitespace-nowrap">{{ tituloAcciones() }}</th>
          }
        </tr>
        @if (hayFiltrosColumna()) {
          <tr data-testid="filtros-columna">
            @if (detalle()) {
              <th></th>
            }
            @if (modoSeleccion() === 'multiple') {
              <th></th>
            }
            @if (acciones().length && posicionAcciones() === 'inicio') {
              <th></th>
            }
            @for (col of columnas(); track $index) {
              <th>
                @if (col.filtrable) {
                  <input
                    pInputText
                    type="text"
                    pSize="small"
                    class="w-full min-w-24"
                    [attr.aria-label]="'Filtrar ' + col.titulo"
                    [value]="filtrosColumna()[col.campo] ?? ''"
                    (input)="filtrarColumna(col.campo, valorDe($event))"
                  />
                }
              </th>
            }
            @if (acciones().length && posicionAcciones() === 'fin') {
              <th></th>
            }
          </tr>
        }
      </ng-template>

      <ng-template #body let-fila let-i="rowIndex" let-expandida="expanded">
        <tr
          [pSelectableRow]="fila"
          [pSelectableRowIndex]="i"
          [pSelectableRowDisabled]="modoSeleccion() !== 'simple'"
        >
          @if (detalle()) {
            <td>
              <p-button
                type="button"
                [pRowToggler]="fila"
                [text]="true"
                [rounded]="true"
                severity="secondary"
                size="small"
                [icon]="expandida ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                [ariaLabel]="expandida ? 'Ocultar detalle' : 'Ver detalle'"
              />
            </td>
          }
          @if (modoSeleccion() === 'multiple') {
            <td><p-tableCheckbox [value]="fila" [index]="i" /></td>
          }
          @if (acciones().length && posicionAcciones() === 'inicio') {
            <ng-container *ngTemplateOutlet="celdaAcciones; context: { $implicit: fila }" />
          }
          @for (col of columnas(); track $index) {
            <td [class]="alinear(col)">
              @let plantilla = plantillas().get(idDe(col));
              @if (plantilla) {
                <ng-container
                  *ngTemplateOutlet="plantilla; context: contextoCelda(fila, col, i)"
                />
              } @else if (col.tipo === 'tag') {
                @let tag = fila | tablaTag: col;
                @if (tag) {
                  <p-tag [value]="tag.texto" [severity]="tag.severidad ?? 'info'" />
                }
              } @else {
                {{ fila | tablaCelda: col : locale }}
              }
            </td>
          }
          @if (acciones().length && posicionAcciones() === 'fin') {
            <ng-container *ngTemplateOutlet="celdaAcciones; context: { $implicit: fila }" />
          }
        </tr>
      </ng-template>

      <ng-template #expandedrow let-fila let-i="rowIndex">
        <tr data-testid="fila-detalle">
          <td [attr.colspan]="totalColumnas()">
            @if (detalle(); as d) {
              <ng-container *ngTemplateOutlet="d.plantilla; context: { $implicit: fila, indice: i }" />
            }
          </td>
        </tr>
      </ng-template>

      <ng-template #emptymessage>
        <tr>
          <td [attr.colspan]="totalColumnas()" class="py-6 text-center text-muted-color">
            {{ mensajeVacio() }}
          </td>
        </tr>
      </ng-template>

      @if (totales()) {
        <ng-template #footer>
          <tr data-testid="fila-totales">
            @for (celda of celdasTotales(); track $index) {
              <td [class]="celda.clase" class="font-semibold">{{ celda.texto }}</td>
            }
          </tr>
        </ng-template>
      }
    </p-table>

    <ng-template #celdaAcciones let-fila>
      <td class="whitespace-nowrap">
        <div class="flex gap-1">
          @for (accion of acciones(); track accion.id) {
            @if (!accion.visible || accion.visible(fila)) {
              <p-button
                type="button"
                [icon]="accion.icono"
                [severity]="accion.severidad ?? 'primary'"
                [text]="true"
                [rounded]="true"
                size="small"
                [pTooltip]="accion.tooltip"
                tooltipPosition="top"
                [ariaLabel]="accion.tooltip"
                [disabled]="accion.deshabilitada ? accion.deshabilitada(fila) : false"
                (onClick)="emitirAccion(accion, fila)"
                [attr.data-accion]="accion.id"
              />
            }
          }
        </div>
      </td>
    </ng-template>
  `,
})
export class Tabla<T extends object> {
  protected readonly locale = inject(LOCALE_ID);
  protected readonly etiquetaExportar = ETIQUETA_EXPORTAR;

  // ---- Datos y columnas ----
  /** Filas. `null`/`undefined` se tratan como `[]`. No se mutan (se ordena una copia). */
  readonly filas = input<readonly T[] | null | undefined>([]);
  readonly columnas = input.required<readonly ColumnaTabla<T>[]>();
  /** Campo con la clave única de cada fila (selección y detalle). Por defecto `'id'`. */
  readonly clave = input('id');
  /** Muestra el overlay de carga de `p-table`. */
  readonly cargando = input(false);
  readonly mensajeVacio = input(MENSAJE_TABLA_VACIA);
  /** Ancho mínimo de la tabla: por debajo aparece scroll horizontal. */
  readonly anchoMinimo = input('50rem');

  // ---- Paginación ----
  readonly paginado = input(true);
  readonly filasPorPagina = input(FILAS_POR_PAGINA);
  readonly opcionesFilasPorPagina = input<number[]>([...OPCIONES_FILAS_POR_PAGINA]);
  /** Modo servidor: la tabla no pagina/ordena/filtra; emite `(cargar)` y la pantalla trae la página. */
  readonly lazy = input(false);
  /** Total de registros en el servidor (solo en modo `lazy`). */
  readonly totalRegistros = input<number>();

  // ---- Búsqueda y filtros ----
  /** Muestra el buscador global. */
  readonly buscador = input(true);
  readonly textoBuscador = input('Buscar...');
  /** Espera (ms) tras teclear antes de filtrar. */
  readonly retardoFiltro = input(300);

  // ---- Selección ----
  /** `'simple'` (clic en la fila) o `'multiple'` (checkboxes). Sin valor, no hay selección. */
  readonly modoSeleccion = input<'simple' | 'multiple' | null>(null);
  /** Filas seleccionadas (`[(seleccion)]`). En modo simple tiene 0 o 1 elemento. */
  readonly seleccion = model<readonly T[]>([]);

  // ---- Acciones por fila ----
  readonly acciones = input<readonly AccionTabla<T>[]>([]);
  readonly posicionAcciones = input<'inicio' | 'fin'>('inicio');
  readonly tituloAcciones = input('Acciones');

  // ---- Totales y exportación ----
  /** Valores del pie por `id`/`campo` de columna (los calcula la pantalla). `null`: sin pie. */
  readonly totales = input<TotalesTabla | null>(null);
  readonly etiquetaTotales = input('Totales');
  /** Botones de exportación a mostrar en la barra. */
  readonly formatosExportacion = input<readonly FormatoExportacion[]>([]);

  // ---- Salidas ----
  readonly accion = output<EventoAccionTabla<T>>();
  readonly exportar = output<EventoExportarTabla<T>>();
  readonly cargar = output<EventoCargaTabla>();

  // ---- Plantillas proyectadas ----
  private readonly celdas = contentChildren(TablaCelda);
  protected readonly detalle = contentChild(TablaDetalle);

  private readonly tabla = viewChild.required<Table>('dt');

  protected readonly busqueda = signal('');
  protected readonly filtrosColumna = signal<Record<string, string | undefined>>({});

  /** Copia de las filas: `p-table` ordena su `value` en el sitio. */
  protected readonly valor = computed<T[]>(() => [...(this.filas() ?? [])]);

  protected readonly plantillas = computed(() => {
    const mapa = new Map<string, TemplateRef<ContextoCeldaTabla<T>>>();
    for (const celda of this.celdas()) {
      mapa.set(celda.appTablaCelda(), celda.plantilla as TemplateRef<ContextoCeldaTabla<T>>);
    }
    return mapa;
  });

  protected readonly camposBusqueda = computed(() =>
    this.columnas()
      .filter((c) => c.buscable !== false)
      .map((c) => c.campo as string),
  );

  protected readonly hayFiltrosColumna = computed(() => this.columnas().some((c) => c.filtrable));

  protected readonly totalColumnas = computed(
    () =>
      this.columnas().length +
      (this.detalle() ? 1 : 0) +
      (this.modoSeleccion() === 'multiple' ? 1 : 0) +
      (this.acciones().length ? 1 : 0),
  );

  protected readonly seleccionTabla = computed(() => {
    const modo = this.modoSeleccion();
    if (modo === 'simple') return this.seleccion()[0] ?? null;
    if (modo === 'multiple') return [...this.seleccion()];
    return null;
  });

  /** Celdas del pie: etiqueta en la primera celda libre y los totales formateados por columna. */
  protected readonly celdasTotales = computed(() => {
    const totales = this.totales() ?? {};
    const celdas: { texto: string; clase: string }[] = [];
    const prefijo =
      (this.detalle() ? 1 : 0) +
      (this.modoSeleccion() === 'multiple' ? 1 : 0) +
      (this.acciones().length && this.posicionAcciones() === 'inicio' ? 1 : 0);
    for (let i = 0; i < prefijo; i++) celdas.push({ texto: '', clase: '' });
    for (const col of this.columnas()) {
      const total = totales[idColumna(col)];
      const texto = typeof total === 'number' ? formatearValor(total, col, this.locale) : (total ?? '');
      celdas.push({ texto, clase: claseAlineacion(col) });
    }
    if (this.acciones().length && this.posicionAcciones() === 'fin') celdas.push({ texto: '', clase: '' });
    const libre = celdas.findIndex((c) => c.texto === '');
    if (libre >= 0) celdas[libre] = { texto: this.etiquetaTotales(), clase: 'text-left' };
    return celdas;
  });

  // ---- API pública ----

  /** Filas visibles tras filtros y orden (todas las páginas; en `lazy`, la página actual). */
  filasVisibles(): T[] {
    const tabla = this.tabla();
    return [...((tabla.filteredValue ?? tabla.value ?? []) as T[])];
  }

  /** Limpia buscador, filtros por columna, orden y vuelve a la primera página. */
  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtrosColumna.set({});
    this.tabla().clear();
  }

  // ---- Manejadores ----

  protected idDe(col: ColumnaTabla<T>): string {
    return idColumna(col);
  }

  protected alinear(col: ColumnaTabla<T>): string {
    return claseAlineacion(col);
  }

  protected contextoCelda(fila: T, col: ColumnaTabla<T>, indice: number): ContextoCeldaTabla<T> {
    return { $implicit: fila, valor: resolverCampo(fila, col.campo), indice };
  }

  protected valorDe(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected buscar(texto: string): void {
    this.busqueda.set(texto);
    this.tabla().filterGlobal(texto, 'contains');
  }

  protected filtrarColumna(campo: string, texto: string): void {
    this.filtrosColumna.update((f) => ({ ...f, [campo]: texto }));
    this.tabla().filter(texto, campo, 'contains');
  }

  protected alCambiarSeleccion(valor: T | T[] | null | undefined): void {
    if (Array.isArray(valor)) this.seleccion.set([...valor]);
    else this.seleccion.set(valor ? [valor] : []);
  }

  protected emitirAccion(accion: AccionTabla<T>, fila: T): void {
    this.accion.emit({ accion: accion.id, fila });
  }

  protected emitirExportar(formato: FormatoExportacion): void {
    this.exportar.emit({ formato, filas: this.filasVisibles() });
  }

  protected alCargar(evento: TableLazyLoadEvent): void {
    if (!this.lazy()) return;
    const filtros: Record<string, string> = {};
    for (const [campo, meta] of Object.entries(evento.filters ?? {})) {
      if (campo === 'global') continue;
      const primero: FilterMetadata | undefined = Array.isArray(meta) ? meta[0] : meta;
      const texto = primero?.value;
      if (texto !== null && texto !== undefined && texto !== '') filtros[campo] = String(texto);
    }
    const orden = evento.sortOrder === 1 || evento.sortOrder === -1 ? evento.sortOrder : undefined;
    const ordenCampo = typeof evento.sortField === 'string' ? evento.sortField : undefined;
    this.cargar.emit({
      primero: evento.first ?? 0,
      filas: evento.rows ?? this.filasPorPagina(),
      ordenCampo,
      orden: ordenCampo ? orden : undefined,
      busqueda: typeof evento.globalFilter === 'string' ? evento.globalFilter : '',
      filtros,
    });
  }
}
