import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { SessionService } from '../../../core/auth';
import { CargaGlobalService } from '../../../core/carga';
import { Documento, EstadoDocumento, type Cliente } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ClienteService, ItemFacturaService, TiposGenericosService } from '../../../core/services';
import { ExcelService } from '../../../core/services/export';
import { soloDigitos } from '../../../core/validators';
import {
  ConfirmacionService,
  Tabla,
  type AccionTabla,
  type EventoAccionTabla,
} from '../../../shared/ui';
import {
  aFilas,
  columnasDocumento,
  fechaFiltro,
  mensajeError,
  paramsRegistro,
  type FilaDocumento,
} from '../facturacion-comun';

interface FormularioFiltros {
  tipoDocumento: FormControl<number>;
  serie: FormControl<string>;
  secuencial: FormControl<string>;
  fechaIni: FormControl<Date | null>;
  fechaFin: FormControl<Date | null>;
  estado: FormControl<number>;
  cliente: FormControl<number>;
}

interface OpcionNumerica {
  valor: number;
  texto: string;
}

const TODOS: OpcionNumerica = { valor: 0, texto: 'Todos' };

/** Consulta de facturas (`factura-consulta` de v1). */
@Component({
  selector: 'app-consulta-facturas',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    Tabla,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sr-only">Consulta de facturas</h1>
    <form
      [formGroup]="form"
      (ngSubmit)="buscar()"
      class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-6"
      aria-label="Filtros de búsqueda"
    >
      <div class="flex flex-col gap-1 sm:col-span-2">
        <label id="tipoDocumento-label" for="tipoDocumento" class="text-sm font-medium">TIPO DOCUMENTO</label>
        <p-select
          inputId="tipoDocumento"
          ariaLabelledBy="tipoDocumento-label"
          formControlName="tipoDocumento"
          [options]="opcionesTipoDocumento"
          optionLabel="texto"
          optionValue="valor"
          appendTo="body"
          data-testid="tipo-documento"
        />
      </div>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">SERIE</span>
        <input pInputText formControlName="serie" data-testid="serie" (input)="filtrarSerie($event)" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">CORRELATIVO</span>
        <input
          pInputText
          formControlName="secuencial"
          inputmode="numeric"
          data-testid="secuencial"
          (input)="filtrarSecuencial($event)"
        />
      </label>
      <div class="flex flex-col gap-1">
        <label for="fechaIni" class="text-sm font-medium">FECHA INICIO EMISION</label>
        <p-datepicker
          inputId="fechaIni"
          formControlName="fechaIni"
          dateFormat="dd/mm/yy"
          [showIcon]="true"
          appendTo="body"
          [invalid]="invalido('fechaIni')"
          [attr.aria-invalid]="invalido('fechaIni') || null"
          [attr.aria-describedby]="invalido('fechaIni') ? 'fechaIni-error' : null"
        />
        @if (invalido('fechaIni')) {
          <p-message id="fechaIni-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
        }
      </div>
      <div class="flex flex-col gap-1">
        <label for="fechaFin" class="text-sm font-medium">FECHA FIN EMISION</label>
        <p-datepicker
          inputId="fechaFin"
          formControlName="fechaFin"
          dateFormat="dd/mm/yy"
          [showIcon]="true"
          appendTo="body"
          [invalid]="invalido('fechaFin')"
          [attr.aria-invalid]="invalido('fechaFin') || null"
          [attr.aria-describedby]="invalido('fechaFin') ? 'fechaFin-error' : null"
        />
        @if (invalido('fechaFin')) {
          <p-message id="fechaFin-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
        }
      </div>
      <div class="flex flex-col gap-1 sm:col-span-2">
        <label id="estado-label" for="estado" class="text-sm font-medium">ESTADO</label>
        <p-select
          inputId="estado"
          ariaLabelledBy="estado-label"
          formControlName="estado"
          [options]="opcionesEstado"
          optionLabel="texto"
          optionValue="valor"
          appendTo="body"
          data-testid="estado"
        />
      </div>
      <div class="flex flex-col gap-1 sm:col-span-2">
        <label id="cliente-label" for="cliente" class="text-sm font-medium">CLIENTE</label>
        <p-select
          inputId="cliente"
          ariaLabelledBy="cliente-label"
          formControlName="cliente"
          [options]="opcionesCliente()"
          optionLabel="texto"
          optionValue="valor"
          [filter]="true"
          filterPlaceholder="Buscar ..."
          emptyFilterMessage="No existen coincidencias"
          appendTo="body"
          data-testid="cliente"
        />
      </div>
      <div class="flex items-end justify-end gap-2 sm:col-span-2">
        <p-button type="submit" label="Buscar" icon="pi pi-search" data-testid="buscar" />
        <p-button
          type="button"
          label="Exportar"
          icon="pi pi-file-excel"
          data-testid="exportar"
          (onClick)="exportar()"
        />
      </div>
    </form>

    <app-tabla
      [filas]="filas()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      anchoMinimo="75rem"
      (accion)="alAccion($event)"
    />
  `,
})
export class ConsultaFacturas {
  private readonly itemFactura = inject(ItemFacturaService);
  private readonly clienteService = inject(ClienteService);
  private readonly excel = inject(ExcelService);
  private readonly carga = inject(CargaGlobalService);
  private readonly avisos = inject(NotificacionService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly sesion = inject(SessionService);
  private readonly router = inject(Router);

  private readonly tiposDocumento = inject(TiposGenericosService).retornarTiposDocumento();

  readonly opcionesTipoDocumento: OpcionNumerica[] = [
    TODOS,
    ...this.tiposDocumento.map((t) => ({ valor: t.id ?? 0, texto: t.nemonico ?? '' })),
  ];
  readonly opcionesEstado: OpcionNumerica[] = [
    TODOS,
    { valor: EstadoDocumento.REGISTRADO, texto: 'Registrado' },
    { valor: EstadoDocumento.CANCELADO, texto: 'Cancelado' },
    { valor: EstadoDocumento.ANULADO, texto: 'Anulado' },
  ];

  private readonly clientes = signal<Cliente[]>([]);
  readonly opcionesCliente = computed<OpcionNumerica[]>(() => [
    TODOS,
    ...this.clientes().map((c) => ({ valor: c.id ?? 0, texto: `RUC ${c.ruc} - ${c.razonSocial}` })),
  ]);

  /** Documentos tal como llegan del backend (lo que se exporta). */
  readonly documentos = signal<Documento[]>([]);
  readonly filas = computed<FilaDocumento[]>(() => aFilas(this.documentos(), this.tiposDocumento));
  readonly cargando = signal(false);

  readonly form: FormGroup<FormularioFiltros>;

  readonly columnas = columnasDocumento();

  readonly acciones: AccionTabla<FilaDocumento>[] = [
    { id: 'consultar', icono: 'pi pi-search', tooltip: 'Consultar', severidad: 'info' },
    { id: 'cancelar', icono: 'pi pi-angle-double-right', tooltip: 'Cancelación', severidad: 'info' },
  ];

  constructor() {
    const hoy = new Date();
    // v1: desde el día 1 del mes actual hasta hoy.
    this.form = new FormGroup<FormularioFiltros>({
      tipoDocumento: new FormControl(0, { nonNullable: true }),
      serie: new FormControl('', { nonNullable: true }),
      secuencial: new FormControl('', { nonNullable: true }),
      fechaIni: new FormControl<Date | null>(new Date(hoy.getFullYear(), hoy.getMonth(), 1), Validators.required),
      fechaFin: new FormControl<Date | null>(hoy, Validators.required),
      estado: new FormControl(0, { nonNullable: true }),
      cliente: new FormControl(0, { nonNullable: true }),
    });
    void this.cargarClientes();
  }

  private get idEmpresa(): number {
    return this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;
  }

  private async cargarClientes(): Promise<void> {
    try {
      this.clientes.set(await firstValueFrom(this.clienteService.listarClientesPorEmpresa(this.idEmpresa)));
    } catch (e) {
      this.avisos.error('Error', mensajeError(e));
    }
  }

  invalido(campo: keyof FormularioFiltros): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  /** v1: `maxlength="5"`. */
  filtrarSerie(evento: Event): void {
    const el = evento.target as HTMLInputElement;
    const limpio = el.value.slice(0, 5);
    if (limpio !== el.value) {
      el.value = limpio;
      this.form.controls.serie.setValue(limpio);
    }
  }

  /** v1: dígitos, `maxlength="8"`. */
  filtrarSecuencial(evento: Event): void {
    const el = evento.target as HTMLInputElement;
    const limpio = soloDigitos(el.value).slice(0, 8);
    if (limpio !== el.value) {
      el.value = limpio;
      this.form.controls.secuencial.setValue(limpio);
    }
  }

  async buscar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.documentos.set([]);
    this.cargando.set(true);
    try {
      this.documentos.set(
        await firstValueFrom(
          this.itemFactura.listarDocumentosPorFiltro(
            this.idEmpresa,
            v.serie || '',
            v.secuencial || '',
            v.tipoDocumento,
            v.cliente,
            v.estado,
            fechaFiltro(v.fechaIni as Date),
            fechaFiltro(v.fechaFin as Date),
          ),
        ),
      );
    } catch (e) {
      this.documentos.set([]);
      this.avisos.error('Error', mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Como v1: exporta todos los documentos de la consulta. */
  async exportar(): Promise<void> {
    await this.carga.ejecutar(() => this.excel.generarReporteFacturacion(this.documentos()), 'Generando Excel');
  }

  alAccion({ accion, fila }: EventoAccionTabla<FilaDocumento>): void {
    if (accion === 'consultar') this.consultar(fila);
    if (accion === 'cancelar') void this.cancelar(fila);
  }

  /** Envía a la pantalla de registro con los mismos parámetros de v1. */
  consultar(fila: Documento): void {
    void this.router.navigate(['/forms/facturacion/registro'], { queryParams: paramsRegistro(fila) });
  }

  async cancelar(fila: Documento): Promise<void> {
    const { serie, secuencia } = fila;
    const aceptado = await this.confirmacion.confirmar({
      mensaje: `Confirma cancelar el documento ${serie} - ${secuencia} ?`,
    });
    if (!aceptado) return;

    const cancelado = new Documento();
    cancelado.id = fila.id;
    cancelado.serie = serie;
    cancelado.secuencia = secuencia;
    cancelado.observacionSunat = 'Cancelado con Fecha ' + new Date().toLocaleDateString();
    cancelado.estado = EstadoDocumento.CANCELADO;

    this.carga.abrir();
    try {
      const respuesta = await firstValueFrom(
        this.itemFactura.cancelarDocumentoElectronico(cancelado, this.idEmpresa),
      );
      // v1 `actualizarRegistroGrilla`: solo cambia el estado de la fila en la grilla.
      this.documentos.update((docs) =>
        docs.map((d) => (d.id === fila.id ? { ...d, estado: EstadoDocumento.CANCELADO } : d)),
      );
      this.avisos.exito(respuesta?.alertMessage || 'Documento cancelado correctamente');
    } catch (e) {
      this.avisos.error('Error', mensajeError(e));
    } finally {
      this.carga.cerrar();
    }
  }
}
