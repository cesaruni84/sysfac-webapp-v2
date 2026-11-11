import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { SessionService } from '../../../core/auth';
import { Factoria, TarifaRuta, Turno } from '../../../core/models';
import type { ErrorResponse, Moneda } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { FactoriaService, TarifaRutaService, TiposGenericosService } from '../../../core/services';
import {
  ConfirmacionService,
  DialogoCrud,
  Tabla,
  TablaCelda,
  accionEditar,
  accionEliminar,
  type AccionTabla,
  type ColumnaTabla,
  type EventoAccionTabla,
} from '../../../shared/ui';

/** Mensaje genérico de v1 cuando el backend no devuelve `errorMessage`. */
export const MENSAJE_ERROR_GENERICO = 'Ocurrió un error inesperado!!, intenta nuevamente.';

/** v1 lista siempre las tarifas de la empresa 1 (`listarTodasLasTarifasPorEmpresa(1)`). */
export const ID_EMPRESA_LISTADO = 1;

interface FormularioTarifa {
  origen: FormControl<Factoria | null>;
  destino: FormControl<Factoria | null>;
  direOrigen: FormControl<string>;
  direDestino: FormControl<string>;
  importe: FormControl<number | null>;
  moneda: FormControl<number | null>;
  notas: FormControl<string>;
  estado: FormControl<boolean>;
}

/** Maestro de tarifas por ruta (`maestro-tarifas` + `maestro-tarifas-popup` de v1). */
@Component({
  selector: 'app-maestro-tarifas',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ToggleSwitchModule,
    Tabla,
    TablaCelda,
    DialogoCrud,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla
      [filas]="tarifas()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      (accion)="alAccion($event)"
    >
      <p-button
        appTablaBarra
        label="Nuevo Registro"
        icon="pi pi-plus"
        data-testid="nuevo"
        (onClick)="abrir()"
      />
      <ng-template appTablaCelda="item" [tipar]="tarifas()" let-i="indice">{{ i + 1 }}</ng-template>
    </app-tabla>

    <app-dialogo-crud
      [(visible)]="dialogoVisible"
      [titulo]="editando() ? 'Actualizar Tarifa - Ruta' : 'Nueva Tarifa - Ruta '"
      icono="pi pi-money-bill"
      ancho="58.75rem"
      [guardando]="guardando()"
      [guardarDeshabilitado]="form.invalid"
      (guardar)="guardar()"
    >
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-6">
        <div class="flex flex-col gap-1 sm:col-span-3">
          <label for="origen" class="text-sm font-medium">ORIGEN</label>
          <p-select
            inputId="origen"
            formControlName="origen"
            [options]="factorias()"
            optionLabel="refLarga2"
            dataKey="id"
            appendTo="body"
            [filter]="true"
            filterBy="refLarga2"
            (onChange)="seleccionarOrigen($event.value)"
            data-testid="origen"
          />
          @if (invalido('origen')) {
            <small class="text-red-500">* REQUERIDO</small>
          }
        </div>
        <div class="flex flex-col gap-1 sm:col-span-3">
          <label for="destino" class="text-sm font-medium">DESTINO</label>
          <p-select
            inputId="destino"
            formControlName="destino"
            [options]="factorias()"
            optionLabel="refLarga2"
            dataKey="id"
            appendTo="body"
            [filter]="true"
            filterBy="refLarga2"
            (onChange)="seleccionarDestino($event.value)"
            data-testid="destino"
          />
          @if (invalido('destino')) {
            <small class="text-red-500">* REQUERIDO</small>
          }
        </div>
        <label class="flex flex-col gap-1 sm:col-span-3">
          <span class="text-sm font-medium">DIRECCION ORIGEN</span>
          <textarea pTextarea rows="2" formControlName="direOrigen" data-testid="dire-origen"></textarea>
        </label>
        <label class="flex flex-col gap-1 sm:col-span-3">
          <span class="text-sm font-medium">DIRECCION DESTINO</span>
          <textarea pTextarea rows="2" formControlName="direDestino" data-testid="dire-destino"></textarea>
        </label>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <label for="importe" class="text-sm font-medium">TARIFA</label>
          <p-inputnumber
            inputId="importe"
            formControlName="importe"
            [minFractionDigits]="2"
            [maxFractionDigits]="4"
            [useGrouping]="false"
            data-testid="importe"
          />
          @if (invalido('importe')) {
            <small class="text-red-500">* REQUERIDO</small>
          }
        </div>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <label for="moneda" class="text-sm font-medium">MONEDA</label>
          <p-select
            inputId="moneda"
            formControlName="moneda"
            [options]="monedas"
            optionLabel="descripcion"
            optionValue="id"
            appendTo="body"
            data-testid="moneda"
          />
        </div>
        <div class="flex items-center gap-2 sm:col-span-2">
          <p-toggleswitch inputId="estado" formControlName="estado" data-testid="estado" />
          <label for="estado" class="text-sm font-medium">Activo</label>
        </div>
        <label class="flex flex-col gap-1 sm:col-span-6">
          <span class="text-sm font-medium">NOTAS</span>
          <input pInputText formControlName="notas" data-testid="notas" />
        </label>
      </form>
    </app-dialogo-crud>
  `,
})
export class MaestroTarifas {
  private readonly servicio = inject(TarifaRutaService);
  private readonly factoriaService = inject(FactoriaService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(NotificacionService);
  private readonly sesion = inject(SessionService);

  readonly monedas: Moneda[] = inject(TiposGenericosService).retornarMonedas();

  readonly tarifas = signal<TarifaRuta[]>([]);
  /** Combo de factorías para origen y destino (v1: `listarComboFactorias('O')`). */
  readonly factorias = signal<Factoria[]>([]);
  readonly cargando = signal(false);
  readonly dialogoVisible = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<TarifaRuta | null>(null);

  readonly form = new FormGroup<FormularioTarifa>({
    origen: new FormControl<Factoria | null>(null, Validators.required),
    destino: new FormControl<Factoria | null>(null, Validators.required),
    direOrigen: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    direDestino: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    importe: new FormControl<number | null>(null, Validators.required),
    moneda: new FormControl<number | null>(null),
    notas: new FormControl('', { nonNullable: true }),
    estado: new FormControl(true, { nonNullable: true }),
  });

  readonly columnas: ColumnaTabla<TarifaRuta>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'origen.refLarga2', titulo: 'Origen', ancho: '20rem' },
    { campo: 'destino.refLarga2', titulo: 'Destino', ancho: '20rem' },
    { campo: 'importe', titulo: 'Importe', tipo: 'numero', digitos: '1.2-2', alineacion: 'izquierda' },
    {
      campo: 'estado',
      titulo: 'Estado',
      tipo: 'tag',
      // v1: estado '0' (comparación laxa) = Vigente; cualquier otro = Inactivo.
      tag: (_v, t) =>
        esVigente(t.estado)
          ? { texto: 'Vigente', severidad: 'success' }
          : { texto: 'Inactivo', severidad: 'secondary' },
    },
  ];

  readonly acciones: AccionTabla<TarifaRuta>[] = [accionEditar(), accionEliminar()];

  constructor() {
    void this.listar();
    this.factoriaService.listarComboFactorias('O').subscribe({
      next: (data) => this.factorias.set(data),
      error: (e: unknown) => this.avisos.error('Error', mensajeError(e)),
    });
  }

  async listar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.tarifas.set(await firstValueFrom(this.servicio.listarTodasLasTarifasPorEmpresa(ID_EMPRESA_LISTADO)));
    } catch (e) {
      this.avisos.error('Error', mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  invalido(campo: keyof FormularioTarifa): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  seleccionarOrigen(factoria: Factoria | null): void {
    this.form.controls.direOrigen.setValue(factoria?.direccion ?? '');
  }

  seleccionarDestino(factoria: Factoria | null): void {
    this.form.controls.direDestino.setValue(factoria?.direccion ?? '');
  }

  abrir(tarifa?: TarifaRuta): void {
    this.editando.set(tarifa ?? null);
    this.form.reset({
      origen: tarifa?.origen ?? null,
      destino: tarifa?.destino ?? null,
      direOrigen: tarifa?.origen?.direccion || '',
      direDestino: tarifa?.destino?.direccion || '',
      importe: tarifa?.importe || null,
      moneda: tarifa?.moneda || null,
      notas: tarifa?.notas || '',
      // Nuevo: activo; edición: activo si estado == 0.
      estado: tarifa ? esVigente(tarifa.estado) : true,
    });
    this.dialogoVisible.set(true);
  }

  async alAccion({ accion, fila }: EventoAccionTabla<TarifaRuta>): Promise<void> {
    if (accion === 'editar') {
      this.abrir(fila);
    } else if (accion === 'eliminar') {
      await this.eliminar(fila);
    }
  }

  private async eliminar(tarifa: TarifaRuta): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      mensaje: `Confirma eliminar la tarifa de la ruta: ${tarifa.origen?.refLarga2 ?? ''}  -->  ${tarifa.destino?.refLarga2 ?? ''} ?`,
      aceptar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    this.cargando.set(true);
    try {
      const info = await firstValueFrom(this.servicio.eliminarTarifa(tarifa));
      this.avisos.exito(info.alertMessage);
      await this.listar();
    } catch (e) {
      this.avisos.error('Error', mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    const original = this.editando();
    const v = this.form.getRawValue();
    // Mismo objeto que arma v1 (origen, destino, importe, moneda, notas, empresa, turno, estado [+ id]).
    const tarifa = new TarifaRuta();
    tarifa.origen = v.origen as Factoria;
    tarifa.destino = v.destino as Factoria;
    tarifa.importe = v.importe as number;
    tarifa.moneda = v.moneda as number;
    tarifa.notas = v.notas;
    tarifa.empresa = this.sesion.getUserLoggedIn()?.empresa;
    const turno = new Turno();
    turno.id = 1;
    tarifa.turno = turno;
    tarifa.estado = v.estado ? 0 : 1;
    if (original) tarifa.id = original.id;

    this.guardando.set(true);
    try {
      await firstValueFrom(
        original ? this.servicio.actualizarTarifa(tarifa) : this.servicio.registrarTarifa(tarifa),
      );
      this.dialogoVisible.set(false);
      this.avisos.exito(
        original ? 'Registro actualizado correctamente !' : 'Registro añadido correctamente !',
      );
      await this.listar();
    } catch (e) {
      this.avisos.error('Error', mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}

/** v1 compara `row.estado == '0'` (laxo): acepta 0 y '0'. */
function esVigente(estado: unknown): boolean {
  return estado == 0 && estado !== '' && estado !== null && estado !== undefined;
}

/** Texto para el usuario: `errorMessage` del backend o el genérico de v1. */
function mensajeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const cuerpo = e.error as Partial<ErrorResponse> | null;
    if (cuerpo && typeof cuerpo === 'object' && cuerpo.errorMessage) return cuerpo.errorMessage;
  }
  return MENSAJE_ERROR_GENERICO;
}
