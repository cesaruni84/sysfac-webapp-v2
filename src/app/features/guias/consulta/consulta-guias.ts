import { formatDate } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { SessionService } from '../../../core/auth';
import { CargaGlobalService } from '../../../core/carga';
import { TipoBusquedaGuias, type ErrorResponse, type GrillaGuiaRemision } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ChoferService, FactoriaService, GuiaRemisionService } from '../../../core/services';
import { ExcelService, type GuiaRemisionFilaExcel } from '../../../core/services/export';
import { completarSecuencia, completarSerie, soloDigitos } from '../../../core/validators';
import {
  ConfirmacionService,
  Tabla,
  accionEliminar,
  accionVer,
  type ColumnaTabla,
  type EventoAccionTabla,
} from '../../../shared/ui';

const MENSAJE_GENERICO = 'Error de comunicación con los servicios. Intenta nuevamente.';

/** Fila de la grilla tal como la devuelve el backend con `conFormateo=true`. */
export type GuiaApi = GrillaGuiaRemision & {
  factura?: string;
  estadoFactura?: number;
  nemonicoEstadoFactura?: string;
};
/** Fila de la tabla: las glosas son solo de presentación/búsqueda y nunca se envían. */
export type GuiaFila = GuiaApi & { estadoFacturaTexto: string; estadoGuiaTexto: string };

interface Opcion {
  id: number;
  etiqueta: string;
}

type CampoNumero = 'nroSerie' | 'nroSecuencia' | 'nroSerieCli' | 'nroSecuenciaCli';

const TODOS: Opcion = { id: 0, etiqueta: 'Todos' };

/** Glosa del estado de factura (`getValueGlosaEstadoFactura` de v1). */
export function glosaEstadoFactura(estado: number | undefined): string {
  switch (estado) {
    case 1:
      return 'Registrado';
    case 2:
      return 'Cancelado';
    case 3:
      return 'Anulado';
    default:
      return '-';
  }
}

/** Consulta de guías de remisión. Port de `paging-table` de v1 (/forms/paging). */
@Component({
  selector: 'app-consulta-guias',
  imports: [ReactiveFormsModule, MessageModule, ButtonModule, InputTextModule, SelectModule, DatePickerModule, Tabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-4 text-xl font-semibold">Consulta de guías</h1>
    <form [formGroup]="form" (ngSubmit)="filtrar()" class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col gap-1">
        <label for="g-serie" class="text-sm font-medium">SERIE</label>
        <input pInputText id="g-serie" formControlName="nroSerie" class="w-full" inputmode="numeric"
          (input)="filtrarDigitos('nroSerie', $event, 5)" (blur)="completar('nroSerie')" data-testid="nroSerie" />
      </div>
      <div class="flex flex-col gap-1">
        <label for="g-secuencia" class="text-sm font-medium">SECUENCIA</label>
        <input pInputText id="g-secuencia" formControlName="nroSecuencia" class="w-full" inputmode="numeric"
          (input)="filtrarDigitos('nroSecuencia', $event, 8)" (blur)="completar('nroSecuencia')" data-testid="nroSecuencia" />
      </div>
      <div class="flex flex-col gap-1">
        <label for="g-serie-cli" class="text-sm font-medium">SERIE CLI</label>
        <input pInputText id="g-serie-cli" formControlName="nroSerieCli" class="w-full" inputmode="numeric"
          (input)="filtrarDigitos('nroSerieCli', $event, 5)" (blur)="completar('nroSerieCli')" data-testid="nroSerieCli" />
      </div>
      <div class="flex flex-col gap-1">
        <label for="g-secuencia-cli" class="text-sm font-medium">SECUENCIA CLI</label>
        <input pInputText id="g-secuencia-cli" formControlName="nroSecuenciaCli" class="w-full" inputmode="numeric"
          (input)="filtrarDigitos('nroSecuenciaCli', $event, 8)" (blur)="completar('nroSecuenciaCli')" data-testid="nroSecuenciaCli" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="g-fecha-ini" class="text-sm font-medium">FECHA INICIO (EMISION)</label>
        <p-datepicker inputId="g-fecha-ini" formControlName="fechaIniTraslado" dateFormat="dd/mm/yy" [showIcon]="true"
          appendTo="body" styleClass="w-full" [invalid]="invalido('fechaIniTraslado')"
          [attr.aria-invalid]="invalido('fechaIniTraslado') || null"
          [attr.aria-describedby]="invalido('fechaIniTraslado') ? 'g-fecha-ini-error' : null" />
        @if (invalido('fechaIniTraslado')) {
          <p-message id="g-fecha-ini-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
        }
      </div>
      <div class="flex flex-col gap-1">
        <label for="g-fecha-fin" class="text-sm font-medium">FECHA FIN (EMISION)</label>
        <p-datepicker inputId="g-fecha-fin" formControlName="fechaFinTraslado" dateFormat="dd/mm/yy" [showIcon]="true"
          appendTo="body" styleClass="w-full" [invalid]="invalido('fechaFinTraslado')"
          [attr.aria-invalid]="invalido('fechaFinTraslado') || null"
          [attr.aria-describedby]="invalido('fechaFinTraslado') ? 'g-fecha-fin-error' : null" />
        @if (invalido('fechaFinTraslado')) {
          <p-message id="g-fecha-fin-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
        }
      </div>
      <div class="flex flex-col gap-1">
        <label id="g-estado-label" for="g-estado" class="text-sm font-medium">ESTADO</label>
        <p-select inputId="g-estado" ariaLabelledBy="g-estado-label" formControlName="estadoSelected"
          [options]="estados" optionLabel="etiqueta" optionValue="id" appendTo="body" class="w-full" />
      </div>
      <div class="flex flex-col gap-1">
        <label id="g-filtro-label" for="g-filtro" class="text-sm font-medium">FILTRO FACTURA</label>
        <p-select inputId="g-filtro" ariaLabelledBy="g-filtro-label" formControlName="filtroFacturas"
          [options]="filtrosFactura" optionLabel="etiqueta" optionValue="id" appendTo="body" class="w-full" />
      </div>

      <div class="flex flex-col gap-1 lg:col-span-2">
        <label id="g-origen-label" for="g-origen" class="text-sm font-medium">ORIGEN</label>
        <p-select inputId="g-origen" ariaLabelledBy="g-origen-label" formControlName="origenSelected"
          [options]="factorias()" optionLabel="etiqueta" optionValue="id" [filter]="true" filterBy="etiqueta"
          filterPlaceholder="Buscar ..." emptyFilterMessage="No existen coincidencias" appendTo="body" class="w-full" />
      </div>
      <div class="flex flex-col gap-1 lg:col-span-2">
        <label id="g-destino-label" for="g-destino" class="text-sm font-medium">DESTINO</label>
        <p-select inputId="g-destino" ariaLabelledBy="g-destino-label" formControlName="destinatarioSelected"
          [options]="factorias()" optionLabel="etiqueta" optionValue="id" [filter]="true" filterBy="etiqueta"
          filterPlaceholder="Buscar ..." emptyFilterMessage="No existen coincidencias" appendTo="body" class="w-full" />
      </div>
      <div class="flex flex-col gap-1 lg:col-span-2">
        <label id="g-chofer-label" for="g-chofer" class="text-sm font-medium">CHOFER</label>
        <p-select inputId="g-chofer" ariaLabelledBy="g-chofer-label" formControlName="choferSelected"
          [options]="choferes()" optionLabel="etiqueta" optionValue="id" [filter]="true" filterBy="etiqueta"
          filterPlaceholder="Buscar ..." emptyFilterMessage="No existen coincidencias" appendTo="body" class="w-full" />
      </div>

      <div class="flex flex-wrap items-end justify-end gap-2 lg:col-span-2">
        <p-button type="submit" label="Buscar" icon="pi pi-search" data-testid="buscar" />
        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" (onClick)="limpiar()" />
      </div>
    </form>

    <app-tabla
      [filas]="guias()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      [formatosExportacion]="['excel']"
      anchoMinimo="110rem"
      (accion)="alAccion($event)"
      (exportar)="exportar()"
    />
  `,
})
export class ConsultaGuias implements OnInit {
  private readonly guiaService = inject(GuiaRemisionService);
  private readonly choferService = inject(ChoferService);
  private readonly factoriaService = inject(FactoriaService);
  private readonly excel = inject(ExcelService);
  private readonly carga = inject(CargaGlobalService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(NotificacionService);
  private readonly sesion = inject(SessionService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly estados: Opcion[] = [
    { id: 99, etiqueta: 'Todos' },
    { id: 0, etiqueta: 'Registrado' },
    { id: 1, etiqueta: 'Anulado' },
  ];
  readonly filtrosFactura: Opcion[] = [
    { id: TipoBusquedaGuias.TODOS, etiqueta: 'Todos' },
    { id: TipoBusquedaGuias.GUIAS_FACTURADAS, etiqueta: 'Guias Facturadas' },
    { id: TipoBusquedaGuias.GUIAS_NO_FACTURADAS, etiqueta: 'Guias Sin Facturar' },
  ];

  readonly factorias = signal<Opcion[]>([TODOS]);
  readonly choferes = signal<Opcion[]>([TODOS]);
  readonly guias = signal<GuiaFila[]>([]);
  readonly cargando = signal(false);

  readonly form = this.crearForm();

  readonly columnas: ColumnaTabla<GuiaFila>[] = [
    { campo: 'id', titulo: 'Item', ancho: '5rem' },
    { campo: 'nroguia', titulo: 'Nro. Serie', ancho: '7rem' },
    { campo: 'nroSecuencia', titulo: 'Nro. Secuencia', ancho: '9rem' },
    { campo: 'nroGuiaCliente', titulo: 'Guía Rem. Cliente' },
    { campo: 'fechaEmision', titulo: 'Fecha de Emisión', ancho: '9rem' },
    { campo: 'cantidad', titulo: 'Cantidad', ancho: '8rem', alineacion: 'izquierda' },
    { campo: 'nroLiq', titulo: 'Nro. de Liquid.' },
    { campo: 'factura', titulo: 'Factura' },
    {
      campo: 'estadoFacturaTexto',
      titulo: 'Estado Factura',
      tipo: 'tag',
      ancho: '9rem',
      tag: (_v, fila) =>
        fila.estadoFactura
          ? {
              texto: fila.estadoFacturaTexto,
              severidad: fila.estadoFactura === 1 ? 'info' : fila.estadoFactura === 2 ? 'success' : 'danger',
            }
          : null,
    },
    {
      campo: 'estadoGuiaTexto',
      titulo: 'Estado Guía',
      tipo: 'tag',
      ancho: '9rem',
      tag: (v) => ({ texto: String(v), severidad: v === 'Registrado' ? 'info' : 'secondary' }),
    },
    { campo: 'remitente', titulo: 'Razón Soc. Rem', ancho: '17rem' },
    { campo: 'destinatario', titulo: 'Razón Soc. Dest', ancho: '16rem' },
    { campo: 'producto', titulo: 'Producto', ancho: '16rem' },
    { campo: 'chofer', titulo: 'Chofer', ancho: '15rem' },
    { campo: 'usuarioRegistra', titulo: 'Usuario Reg.', ancho: '8rem' },
    { campo: 'fechaRecepcion', titulo: 'Fec. Recepción', ancho: '9rem' },
  ];

  readonly acciones = [accionVer<GuiaFila>(), accionEliminar<GuiaFila>()];

  private crearForm() {
    const hoy = new Date();
    return this.fb.group({
      nroSerie: '',
      nroSecuencia: '',
      nroSerieCli: '',
      nroSecuenciaCli: '',
      fechaIniTraslado: [new Date(hoy.getFullYear(), hoy.getMonth(), 1) as Date | null, Validators.required],
      fechaFinTraslado: [hoy as Date | null, Validators.required],
      estadoSelected: 99,
      choferSelected: 0,
      origenSelected: 0,
      destinatarioSelected: 0,
      filtroFacturas: TipoBusquedaGuias.TODOS as number,
    });
  }

  ngOnInit(): void {
    // v1: combo de factorías con tipo 'D' y de choferes de la empresa 1.
    this.factoriaService.listarComboFactorias('D').subscribe({
      next: (data) => this.factorias.set([TODOS, ...data.map((f) => ({ id: f.id ?? 0, etiqueta: f.refLarga2 ?? '' }))]),
      error: (err: unknown) => this.avisarError(err),
    });
    this.choferService.listarComboChoferes(1).subscribe({
      next: (data) =>
        this.choferes.set([TODOS, ...data.map((c) => ({ id: c.id ?? 0, etiqueta: `${c.nombres ?? ''} ${c.apellidos ?? ''}` }))]),
      error: (err: unknown) => this.avisarError(err),
    });
  }

  /** Solo dígitos y longitud máxima (serie 5, secuencia 8), al teclear y al pegar. */
  filtrarDigitos(nombre: CampoNumero, evento: Event, maximo: number): void {
    const el = evento.target as HTMLInputElement;
    const limpio = soloDigitos(el.value).slice(0, maximo);
    if (limpio !== el.value) {
      el.value = limpio;
    }
    this.form.controls[nombre].setValue(limpio);
  }

  /** Completa con ceros a la izquierda (serie 5, secuencia 8) si hay texto, como el `pad` de v1. */
  completar(nombre: CampoNumero): void {
    const completa = nombre === 'nroSerie' || nombre === 'nroSerieCli' ? completarSerie : completarSecuencia;
    const valor = this.form.controls[nombre].value;
    if (valor) this.form.controls[nombre].setValue(completa(valor));
  }

  limpiar(): void {
    this.form.reset(this.crearForm().getRawValue());
  }

  invalido(nombre: keyof ConsultaGuias['form']['controls']): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  /** Mismo orden que v1: guía propia > guía del cliente > solo filtros. */
  async filtrar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.controls.fechaIniTraslado.invalid || this.form.controls.fechaFinTraslado.invalid) return;
    const v = this.form.getRawValue();
    const porCliente = !(v.nroSerie || v.nroSecuencia) && !!(v.nroSerieCli || v.nroSecuenciaCli);
    await this.buscar(porCliente);
  }

  private async buscar(porCliente: boolean): Promise<void> {
    const serie = porCliente ? 'nroSerieCli' : 'nroSerie';
    const secuencia = porCliente ? 'nroSecuenciaCli' : 'nroSecuencia';
    this.completar(serie);
    this.completar(secuencia);
    const v = this.form.getRawValue();
    const nroSerie = v[serie];
    const nroSecuencia = v[secuencia];
    // v1: con serie y secuencia informadas se ignora el filtro de facturas.
    const tipoBusqueda = nroSerie && nroSecuencia ? TipoBusquedaGuias.TODOS : v.filtroFacturas;
    const fechaIni = formatDate(v.fechaIniTraslado as Date, 'yyyy-MM-dd', 'en-US');
    const fechaFin = formatDate(v.fechaFinTraslado as Date, 'yyyy-MM-dd', 'en-US');
    const idEmpresa = this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;

    this.cargando.set(true);
    try {
      const args = [
        idEmpresa,
        nroSerie,
        nroSecuencia,
        v.estadoSelected,
        v.choferSelected,
        v.origenSelected,
        v.destinatarioSelected,
        true,
        tipoBusqueda,
        fechaIni,
        fechaFin,
      ] as const;
      const datos = await firstValueFrom(
        porCliente ? this.guiaService.listarGuiasPorGuiaCliente(...args) : this.guiaService.listarGuiasConFiltros(...args),
      );
      // Con conFormateo=true el backend devuelve filas de grilla (v1 las asigna sin tipar).
      this.guias.set((datos as unknown as GuiaApi[]).map((g) => this.aFila(g)));
    } catch (err) {
      this.guias.set([]);
      this.avisarError(err);
    } finally {
      this.cargando.set(false);
    }
  }

  private aFila(g: GuiaApi): GuiaFila {
    return {
      ...g,
      estadoFacturaTexto: g.estadoFactura ? glosaEstadoFactura(g.estadoFactura) : '',
      estadoGuiaTexto: g.estado === 'REGISTRADO' ? 'Registrado' : 'Anulado',
    };
  }

  async alAccion({ accion, fila }: EventoAccionTabla<GuiaFila>): Promise<void> {
    if (accion === 'ver') {
      // v1 `consultarGuia`: el registro lee estos parámetros.
      void this.router.navigate(['/forms/basic'], { queryParams: { _serie: fila.nroguia, _secuencia: fila.nroSecuencia } });
    } else if (accion === 'eliminar') {
      await this.eliminar(fila);
    }
  }

  private async eliminar(fila: GuiaFila): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      mensaje: `Confirma eliminar la guia de remisión: ${fila.nroguia}  -  ${fila.nroSecuencia} ?`,
      aceptar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    const idEmpresa = this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;
    this.carga.abrir();
    try {
      const info = await firstValueFrom(this.guiaService.eliminarGuiaBD(fila.nroguia, fila.nroSecuencia, idEmpresa));
      this.avisos.exito('OK', info.alertMessage);
    } catch (err) {
      this.avisarError(err);
      return;
    } finally {
      this.carga.cerrar();
    }
    await this.filtrar();
  }

  /** v1 exporta todas las filas de la consulta (`this.rows`), sin importar el buscador de la tabla. */
  async exportar(): Promise<void> {
    const filas: GuiaRemisionFilaExcel[] = this.guias().map((g) => ({
      id: g.id,
      nroguia: g.nroguia,
      nroSecuencia: g.nroSecuencia,
      fechaEmision: g.fechaEmision,
      usuarioRegistra: g.usuarioRegistra,
      nroLiq: g.nroLiq,
      ordenServicio: g.ordenServicio,
      remitente: g.remitente,
      destinatario: g.destinatario,
      estado: g.estado,
      producto: g.producto,
      cantidad: g.cantidad,
      chofer: g.chofer,
      nroGuiaCliente: g.nroGuiaCliente,
      fechaRecepcion: g.fechaRecepcion,
      factura: g.factura,
      nemonicoEstadoFactura: g.nemonicoEstadoFactura,
    }));
    await this.carga.ejecutar(() => this.excel.generarReporteGuiasRemision(filas), 'Generando Excel');
  }

  private avisarError(err: unknown): void {
    const cuerpo = err instanceof HttpErrorResponse ? (err.error as Partial<ErrorResponse> | null) : null;
    this.avisos.error('Error', cuerpo?.errorMessage || MENSAJE_GENERICO);
  }
}
