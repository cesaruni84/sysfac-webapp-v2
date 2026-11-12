import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { SessionService } from '../../../core/auth';
import { CargaGlobalService } from '../../../core/carga';
import {
  EstadoLiquidacion,
  TipoBusquedaLiq,
  type ErrorResponse,
  type Factoria,
  type Liquidacion,
} from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { FactoriaService, LiquidacionService } from '../../../core/services';
import { ExcelService } from '../../../core/services/export';
import { completarNroDoc, soloDigitos } from '../../../core/validators';
import {
  ConfirmacionService,
  Tabla,
  TablaCelda,
  accionEliminar,
  accionVer,
  type AccionTabla,
  type ColumnaTabla,
  type EventoAccionTabla,
} from '../../../shared/ui';

const MENSAJE_GENERICO = 'Error de comunicación con los servicios. Intenta nuevamente.';
const LONGITUD_NRO_DOC = 12;

/** Fila de la tabla: los campos `*Texto` son solo de presentación/búsqueda y nunca se envían. */
type LiquidacionFila = Liquidacion & { facturaTexto: string; estadoTexto: string };

/** Opción de combo de factorías ("Todos" tiene id 0, como el `value="0"` de v1). */
interface FactoriaOpcion {
  id: number;
  refLarga2: string;
}

const TODOS: FactoriaOpcion = { id: 0, refLarga2: 'Todos' };

/** `formatDate(fecha, 'yyyy-MM-dd')` de v1: fecha local, sin conversión de zona horaria. */
export function formatoFechaFiltro(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${String(fecha.getFullYear()).padStart(4, '0')}-${mes}-${dia}`;
}

/** Glosa del estado de una liquidación (v1: `'1'` es Vigente, cualquier otro valor Vencido). */
export function glosaEstadoLiquidacion(estado: number | string | undefined): string {
  return Number(estado) === EstadoLiquidacion.VIGENTE ? 'Vigente' : 'Vencido';
}

/** Consulta de liquidaciones. Port de `rich-text-editor` (/forms/busquedaLiquidaciones) de v1. */
@Component({
  selector: 'app-consulta-liquidaciones',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    Tabla,
    TablaCelda,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="filtros" (ngSubmit)="buscar()" class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col gap-1">
        <label for="cl-nro" class="text-sm font-medium">NRO. DE LIQUIDACION</label>
        <input
          pInputText
          id="cl-nro"
          formControlName="nroDocLiq"
          inputmode="numeric"
          class="w-full"
          (input)="filtrarDigitos($event)"
          (change)="completarNro()"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label id="cl-estado-label" for="cl-estado" class="text-sm font-medium">ESTADO</label>
        <p-select
          inputId="cl-estado"
          ariaLabelledBy="cl-estado-label"
          formControlName="estado"
          [options]="estados"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="cl-fini" class="text-sm font-medium">FECHA INICIO (LIQ.)</label>
        <p-datepicker
          inputId="cl-fini"
          formControlName="fechaIni"
          dateFormat="dd/mm/yy"
          [showIcon]="true"
          appendTo="body"
          styleClass="w-full"
          inputStyleClass="w-full"
          [invalid]="invalido('fechaIni')"
        />
        @if (invalido('fechaIni')) {
          <p-message id="cl-fini-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
        }
      </div>
      <div class="flex flex-col gap-1">
        <label for="cl-ffin" class="text-sm font-medium">FECHA FIN (LIQ.)</label>
        <p-datepicker
          inputId="cl-ffin"
          formControlName="fechaFin"
          dateFormat="dd/mm/yy"
          [showIcon]="true"
          appendTo="body"
          styleClass="w-full"
          inputStyleClass="w-full"
          [invalid]="invalido('fechaFin')"
        />
        @if (invalido('fechaFin')) {
          <p-message id="cl-ffin-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
        }
      </div>
      <div class="flex flex-col gap-1 lg:col-span-2">
        <label id="cl-origen-label" for="cl-origen" class="text-sm font-medium">ORIGEN</label>
        <p-select
          inputId="cl-origen"
          ariaLabelledBy="cl-origen-label"
          formControlName="origen"
          [options]="origenes()"
          optionLabel="refLarga2"
          optionValue="id"
          [filter]="true"
          filterBy="refLarga2"
          filterPlaceholder="Buscar ..."
          emptyFilterMessage="No existen coincidencias"
          appendTo="body"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1 lg:col-span-2">
        <label id="cl-destino-label" for="cl-destino" class="text-sm font-medium">DESTINO</label>
        <p-select
          inputId="cl-destino"
          ariaLabelledBy="cl-destino-label"
          formControlName="destino"
          [options]="destinos()"
          optionLabel="refLarga2"
          optionValue="id"
          [filter]="true"
          filterBy="refLarga2"
          filterPlaceholder="Buscar ..."
          emptyFilterMessage="No existen coincidencias"
          appendTo="body"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label id="cl-factura-label" for="cl-factura" class="text-sm font-medium">FILTRO FACTURA</label>
        <p-select
          inputId="cl-factura"
          ariaLabelledBy="cl-factura-label"
          formControlName="tipoBusqueda"
          [options]="tiposBusqueda"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
          class="w-full"
        />
      </div>
      <div class="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-3">
        <p-button type="submit" label="Buscar" icon="pi pi-search" [disabled]="cargando()" />
      </div>
    </form>

    <app-tabla
      [filas]="filas()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      [formatosExportacion]="['excel']"
      [filasPorPagina]="5"
      (accion)="alAccion($event)"
      (exportar)="exportar()"
    >
      <ng-template appTablaCelda="item" [tipar]="filas()" let-i="indice">{{ i + 1 }}</ng-template>
      <ng-template appTablaCelda="nrodoc" [tipar]="filas()" let-fila>
        <a [routerLink]="['/forms/liquidacion']" [queryParams]="{ nroDocLiq: fila.nrodoc }" class="text-primary hover:underline">{{
          fila.nrodoc
        }}</a>
      </ng-template>
    </app-tabla>
  `,
})
export class ConsultaLiquidaciones implements OnInit {
  private readonly liquidacionService = inject(LiquidacionService);
  private readonly factoriaService = inject(FactoriaService);
  private readonly excel = inject(ExcelService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(NotificacionService);
  private readonly carga = inject(CargaGlobalService);
  private readonly sesion = inject(SessionService);
  private readonly router = inject(Router);

  readonly estados = [
    { value: EstadoLiquidacion.TODOS, label: 'Todos' },
    { value: EstadoLiquidacion.VIGENTE, label: 'Vigente' },
    { value: EstadoLiquidacion.VENCIDO, label: 'Vencido' },
  ];
  readonly tiposBusqueda = [
    { value: TipoBusquedaLiq.TODOS, label: 'Todos' },
    { value: TipoBusquedaLiq.LIQ_FACTURADAS, label: 'Liq. Facturadas' },
    { value: TipoBusquedaLiq.LIQ_NO_FACTURADAS, label: 'Liq. No Facturadas' },
  ];

  readonly liquidaciones = signal<Liquidacion[]>([]);
  readonly origenes = signal<FactoriaOpcion[]>([TODOS]);
  readonly destinos = signal<FactoriaOpcion[]>([TODOS]);
  readonly cargando = signal(false);

  /** Filas con los campos calculados para mostrar y buscar. */
  readonly filas = computed<LiquidacionFila[]>(() =>
    this.liquidaciones().map((l) => ({
      ...l,
      facturaTexto: l.documento != null ? `${l.documento.serie}-${l.documento.secuencia}` : '-',
      estadoTexto: glosaEstadoLiquidacion(l.estado),
    })),
  );

  readonly filtros = inject(NonNullableFormBuilder).group({
    nroDocLiq: [''],
    // v1: rango inicial = del primer día del mes actual a hoy.
    fechaIni: [new Date(new Date().getFullYear(), new Date().getMonth(), 1) as Date | null, Validators.required],
    fechaFin: [new Date() as Date | null, Validators.required],
    origen: [0],
    destino: [0],
    estado: [EstadoLiquidacion.TODOS as number],
    tipoBusqueda: [TipoBusquedaLiq.TODOS as number],
  });

  readonly columnas: ColumnaTabla<LiquidacionFila>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'nrodoc', titulo: 'Nro. Liquidación', tipo: 'plantilla', ancho: '9rem' },
    { campo: 'fechaEmision', titulo: 'F. Emisión Liq.', tipo: 'fecha', ancho: '8rem' },
    { campo: 'facturaTexto', titulo: 'Factura', ancho: '8rem' },
    { campo: 'origen.refLarga1', titulo: 'Origen' },
    { campo: 'destino.refLarga1', titulo: 'Destino' },
    {
      campo: 'estadoTexto',
      titulo: 'Estado',
      tipo: 'tag',
      tag: (valor, fila) => ({
        texto: String(valor),
        severidad: Number(fila.estado) === EstadoLiquidacion.VIGENTE ? 'success' : 'secondary',
      }),
      ancho: '8rem',
    },
    { campo: 'importeTotal', titulo: 'Total Importe', tipo: 'moneda', moneda: 'S/', digitos: '1.2-2', alineacion: 'centro' },
  ];

  readonly acciones: AccionTabla<LiquidacionFila>[] = [
    { ...accionVer<LiquidacionFila>(), tooltip: 'Consultar Liquidación' },
    accionEliminar<LiquidacionFila>(),
  ];

  ngOnInit(): void {
    // v1: dos llamadas al mismo combo (origen 'O' y destino 'D').
    this.factoriaService.listarComboFactorias('O').subscribe({
      next: (data) => this.origenes.set([TODOS, ...this.opciones(data)]),
      error: (err: unknown) => this.avisarError(err),
    });
    this.factoriaService.listarComboFactorias('D').subscribe({
      next: (data) => this.destinos.set([TODOS, ...this.opciones(data)]),
      error: (err: unknown) => this.avisarError(err),
    });
  }

  private opciones(data: Factoria[]): FactoriaOpcion[] {
    return data.map((f) => ({ id: f.id as number, refLarga2: f.refLarga2 ?? '' }));
  }

  /** Solo dígitos (máx. 12) al teclear y al pegar. */
  filtrarDigitos(evento: Event): void {
    const el = evento.target as HTMLInputElement;
    const limpio = soloDigitos(el.value).slice(0, LONGITUD_NRO_DOC);
    if (limpio !== el.value) {
      el.value = limpio;
      this.filtros.controls.nroDocLiq.setValue(limpio);
    }
  }

  /** v1: al cambiar, completa con ceros a la izquierda hasta 12 posiciones. */
  completarNro(): void {
    const control = this.filtros.controls.nroDocLiq;
    control.setValue(completarNroDoc(control.value));
  }

  async buscar(): Promise<void> {
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      return;
    }
    const v = this.filtros.getRawValue();
    const nroDocLiq = v.nroDocLiq;
    // v1: con número de documento se ignora el filtro de facturación.
    const tipoBusqueda = nroDocLiq ? TipoBusquedaLiq.TODOS : v.tipoBusqueda;
    const idEmpresa = this.sesion.getUserLoggedIn()?.empresa?.id as number;
    this.cargando.set(true);
    try {
      const datos = await firstValueFrom(
        this.liquidacionService.listarLiquidacionesPorFiltro(
          idEmpresa,
          nroDocLiq || '',
          v.origen,
          v.destino,
          v.estado,
          tipoBusqueda,
          formatoFechaFiltro(v.fechaIni as Date),
          formatoFechaFiltro(v.fechaFin as Date),
        ),
      );
      this.liquidaciones.set(datos);
    } catch (err) {
      this.liquidaciones.set([]);
      this.avisarError(err);
    } finally {
      this.cargando.set(false);
    }
  }

  async alAccion({ accion, fila }: EventoAccionTabla<LiquidacionFila>): Promise<void> {
    if (accion === 'ver') {
      this.consultarLiquidacion(fila);
    } else if (accion === 'eliminar') {
      await this.eliminar(fila);
    }
  }

  /** v1: envía a la página de registro con el número de documento. */
  consultarLiquidacion(fila: Liquidacion): void {
    void this.router.navigate(['/forms/liquidacion'], { queryParams: { nroDocLiq: fila.nrodoc } });
  }

  async eliminar(fila: Liquidacion): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      mensaje: `Confirma eliminar la liquidacion :  ${fila.nrodoc}  ?`,
      aceptar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    const idEmpresa = this.sesion.getUserLoggedIn()?.empresa?.id as number;
    this.carga.abrir('Eliminando');
    let resp;
    try {
      resp = await firstValueFrom(this.liquidacionService.eliminarLiquidacionBD(idEmpresa, fila));
    } catch (err) {
      this.avisarError(err);
      return;
    } finally {
      this.carga.cerrar();
    }
    this.avisos.exito(resp.alertMessage);
    await this.buscar();
  }

  /** v1 exporta todas las filas de la consulta (no solo las filtradas por el buscador). */
  async exportar(): Promise<void> {
    await this.carga.ejecutar(() => this.excel.generarReporteLiquidaciones(this.liquidaciones()), 'Generando Excel');
  }

  invalido(nombre: keyof ConsultaLiquidaciones['filtros']['controls']): boolean {
    const c = this.filtros.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  private avisarError(err: unknown): void {
    const cuerpo = err instanceof HttpErrorResponse ? (err.error as Partial<ErrorResponse> | null) : null;
    this.avisos.error('Error', cuerpo?.errorMessage || MENSAJE_GENERICO);
  }
}
