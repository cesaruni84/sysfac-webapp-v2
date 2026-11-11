import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { SessionService } from '../../../core/auth';
import type { Chofer, ErrorResponse, Vehiculo } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ChoferService, VehiculoService } from '../../../core/services';
import { digitos } from '../../../core/validators';
import {
  ConfirmacionService,
  DialogoCrud,
  Tabla,
  TablaCelda,
  accionEditar,
  accionEliminar,
  type ColumnaTabla,
  type EventoAccionTabla,
} from '../../../shared/ui';

const MENSAJE_GENERICO = 'Ocurrió un error inesperado!!, intenta nuevamente.';

type VehiculoOpcion = Vehiculo & { etiqueta: string };

/** Maestro de Choferes. Port de `maestro-choferes` de v1. */
@Component({
  selector: 'app-maestro-choferes',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, Tabla, TablaCelda, DialogoCrud],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla [filas]="choferes()" [columnas]="columnas" [acciones]="acciones" [cargando]="cargando()" (accion)="alAccion($event)">
      <p-button appTablaBarra label="Nuevo Registro" icon="pi pi-plus" (onClick)="abrir()" />
      <ng-template appTablaCelda="item" [tipar]="choferes()" let-i="indice">{{ i + 1 }}</ng-template>
    </app-tabla>

    <app-dialogo-crud
      [(visible)]="dialogoVisible"
      [titulo]="editando() ? 'Actualizar Chofer' : 'Nuevo Chofer'"
      icono="pi pi-user"
      [guardando]="guardando()"
      [guardarDeshabilitado]="form.invalid"
      (guardar)="guardar()"
    >
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">NOMBRES</span>
          <input pInputText formControlName="nombres" data-testid="nombres" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">APELLIDOS</span>
          <input pInputText formControlName="apellidos" data-testid="apellidos" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">DNI</span>
          <input pInputText formControlName="dni" maxlength="8" inputmode="numeric" data-testid="dni" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">TELEFONO</span>
          <input pInputText formControlName="telefono" inputmode="numeric" data-testid="telefono" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">EMAIL</span>
          <input pInputText formControlName="email" data-testid="email" />
        </label>
        <div class="flex flex-col gap-1">
          <label for="c-vehiculo" class="text-sm font-medium">VEHICULO ASIGNADO (Tracto/Bombona/Marca)</label>
          <p-select
            inputId="c-vehiculo"
            formControlName="vehiculo"
            [options]="vehiculos()"
            optionLabel="etiqueta"
            dataKey="id"
            placeholder="Seleccione"
            appendTo="body"
            (onChange)="seleccionarVehiculo($event.value)"
            data-testid="vehiculo"
          />
        </div>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">NRO. CERT. INSCRIPCION</span>
          <input pInputText formControlName="certificado" data-testid="certificado" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">NRO. LICENCIA CONDUCIR</span>
          <input pInputText formControlName="licencia" data-testid="licencia" />
        </label>
      </form>
    </app-dialogo-crud>
  `,
})
export class MaestroChoferes implements OnInit {
  private readonly servicio = inject(ChoferService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(NotificacionService);
  private readonly sesion = inject(SessionService);

  readonly choferes = signal<Chofer[]>([]);
  readonly vehiculos = signal<VehiculoOpcion[]>([]);
  readonly cargando = signal(false);
  readonly dialogoVisible = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Chofer | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    dni: ['', [Validators.required, Validators.maxLength(8), digitos]],
    telefono: ['', digitos],
    email: [''],
    vehiculo: [null as Vehiculo | null, Validators.required],
    certificado: ['', Validators.required],
    licencia: ['', Validators.required],
  });

  readonly columnas: ColumnaTabla<Chofer>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'nombres', titulo: 'Nombres' },
    { campo: 'apellidos', titulo: 'Apellidos' },
    { campo: 'dni', titulo: 'DNI', ancho: '8rem' },
    { campo: 'licencia', titulo: 'Licencia Conductor' },
    {
      campo: 'vehiculo.placaTracto',
      titulo: 'Vehiculo asignado (tracto / bombona)',
      formato: (_v, c) => `${c.vehiculo?.placaTracto ?? ''} / ${c.vehiculo?.placaBombona ?? ''}`,
    },
  ];

  readonly acciones = [accionEditar<Chofer>(), accionEliminar<Chofer>()];

  ngOnInit(): void {
    void this.listar();
    // v1: combo de vehículos de la empresa 1.
    this.vehiculoService.listarTodosLosVehiculosPorEmpresa(1).subscribe({
      next: (data) =>
        this.vehiculos.set(data.map((v) => ({ ...v, etiqueta: `${v.placaTracto} / ${v.placaBombona} / ${v.modelo}` }))),
      error: (err: unknown) => this.avisarError(err),
    });
  }

  async listar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.choferes.set(await firstValueFrom(this.servicio.listarTodosLosChoferes(1)));
    } catch (err) {
      this.avisarError(err);
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(chofer?: Chofer): void {
    this.editando.set(chofer ?? null);
    this.form.reset({
      nombres: chofer?.nombres ?? '',
      apellidos: chofer?.apellidos ?? '',
      dni: chofer?.dni ?? '',
      telefono: chofer?.telefono ?? '',
      email: chofer?.email ?? '',
      vehiculo: chofer?.vehiculo ?? null,
      certificado: chofer?.certificado ?? '',
      licencia: chofer?.licencia ?? '',
    });
    this.dialogoVisible.set(true);
  }

  /** v1: al elegir vehículo, el certificado toma la licencia (certificado MTC) del vehículo. */
  seleccionarVehiculo(vehiculo: Vehiculo | null): void {
    this.form.patchValue({ certificado: vehiculo?.licencia ?? '' });
  }

  async alAccion({ accion, fila }: EventoAccionTabla<Chofer>): Promise<void> {
    if (accion === 'editar') {
      this.abrir(fila);
    } else if (accion === 'eliminar') {
      // v1 no elimina choferes: confirma y avisa "Opción deshabilitada".
      const ok = await this.confirmacion.confirmar({
        mensaje: `Confirma eliminar el registro: ${fila.nombres} ${fila.apellidos}?`,
        aceptar: 'Eliminar',
        peligro: true,
      });
      if (ok) this.avisos.info('Opción deshabilitada !');
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) return;
    const v = this.form.getRawValue();
    const original = this.editando();
    // Sin la etiqueta de presentación del combo: el vehículo enviado es el de v1.
    const vehiculo: Partial<VehiculoOpcion> = { ...v.vehiculo };
    delete vehiculo.etiqueta;
    // JSON idéntico al de v1 (la empresa lleva id 1, como en v1; se copia sin mutar la sesión).
    const chofer: Chofer = {
      nombres: v.nombres,
      apellidos: v.apellidos,
      dni: v.dni,
      telefono: v.telefono,
      email: v.email,
      vehiculo,
      licencia: v.licencia,
      certificado: v.certificado,
    };
    const empresa = original ? original.empresa : this.sesion.getUserLoggedIn()?.empresa;
    if (empresa) chofer.empresa = { ...empresa, id: 1 };
    if (original) chofer.id = original.id;
    this.guardando.set(true);
    try {
      await firstValueFrom(original ? this.servicio.actualizarChofer(chofer) : this.servicio.registrarChofer(chofer));
      this.dialogoVisible.set(false);
      this.avisos.exito(original ? 'Registro actualizado correctamente !' : 'Registro añadido correctamente !');
      await this.listar();
    } catch (err) {
      this.avisarError(err);
    } finally {
      this.guardando.set(false);
    }
  }

  private avisarError(err: unknown): void {
    const cuerpo = err instanceof HttpErrorResponse ? (err.error as Partial<ErrorResponse> | null) : null;
    this.avisos.error('Error', cuerpo?.errorMessage || MENSAJE_GENERICO);
  }
}
