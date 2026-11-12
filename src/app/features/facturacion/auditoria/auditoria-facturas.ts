import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';

import { SessionService } from '../../../core/auth';
import { TipoFactura, type Documento } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ItemFacturaService, TiposGenericosService } from '../../../core/services';
import { Tabla, type AccionTabla, type EventoAccionTabla } from '../../../shared/ui';
import {
  aFilas,
  columnasDocumento,
  fechaFiltro,
  mensajeError,
  paramsRegistro,
  type FilaDocumento,
} from '../facturacion-comun';

interface FormularioFiltros {
  fechaIni: FormControl<Date | null>;
  fechaFin: FormControl<Date | null>;
}

/** Auditoría de facturas: documentos con errores (`factura-auditoria` de v1). */
@Component({
  selector: 'app-auditoria-facturas',
  imports: [ReactiveFormsModule, ButtonModule, DatePickerModule, MessageModule, Tabla],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sr-only">Auditoría de facturas</h1>
    <form
      [formGroup]="form"
      (ngSubmit)="buscar()"
      class="mb-4 flex flex-wrap items-end gap-4"
      aria-label="Filtros de búsqueda"
    >
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
      <p-button type="submit" label="Buscar" icon="pi pi-search" data-testid="buscar" />
    </form>

    <app-tabla
      [filas]="filas()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      anchoMinimo="70rem"
      (accion)="alAccion($event)"
    />
  `,
})
export class AuditoriaFacturas {
  private readonly itemFactura = inject(ItemFacturaService);
  private readonly avisos = inject(NotificacionService);
  private readonly sesion = inject(SessionService);
  private readonly router = inject(Router);
  private readonly tiposDocumento = inject(TiposGenericosService).retornarTiposDocumento();

  readonly documentos = signal<Documento[]>([]);
  readonly filas = computed<FilaDocumento[]>(() => aFilas(this.documentos(), this.tiposDocumento));
  readonly cargando = signal(false);

  readonly form: FormGroup<FormularioFiltros>;
  readonly columnas = columnasDocumento();
  readonly acciones: AccionTabla<FilaDocumento>[] = [
    { id: 'consultar', icono: 'pi pi-search', tooltip: 'Consultar', severidad: 'info' },
  ];

  constructor() {
    const hoy = new Date();
    // v1: desde el 1 de enero del año actual hasta hoy.
    this.form = new FormGroup<FormularioFiltros>({
      fechaIni: new FormControl<Date | null>(new Date(hoy.getFullYear(), 0, 1), Validators.required),
      fechaFin: new FormControl<Date | null>(hoy, Validators.required),
    });
  }

  invalido(campo: keyof FormularioFiltros): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  async buscar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const idEmpresa = this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;
    this.documentos.set([]);
    this.cargando.set(true);
    try {
      this.documentos.set(
        await firstValueFrom(
          this.itemFactura.listarDocumentosConErrores(
            idEmpresa,
            TipoFactura.CON_LIQUIDACION,
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

  alAccion({ accion, fila }: EventoAccionTabla<FilaDocumento>): void {
    if (accion === 'consultar') this.consultar(fila);
  }

  /** Envía a la pantalla de registro con los mismos parámetros de v1. */
  consultar(fila: Documento): void {
    void this.router.navigate(['/forms/facturacion/registro'], { queryParams: paramsRegistro(fila) });
  }
}
