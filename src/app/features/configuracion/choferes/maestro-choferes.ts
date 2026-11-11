import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { SessionService } from '../../../core/auth';
import type { Chofer, ErrorResponse, Vehiculo } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ChoferService, VehiculoService } from '../../../core/services';
import { digitos, soloDigitos } from '../../../core/validators';
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
/** Fila de la tabla: `vehiculoTexto` es solo de presentación/búsqueda y nunca se envía. */
type ChoferFila = Chofer & { vehiculoTexto: string };

/** Maestro de Choferes. Port de `maestro-choferes` de v1. */
@Component({
  selector: 'app-maestro-choferes',
  imports: [ReactiveFormsModule, MessageModule, ButtonModule, InputTextModule, SelectModule, Tabla, TablaCelda, DialogoCrud],
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
        <div class="flex flex-col gap-1">
          <label for="c-nombres" class="text-sm font-medium">NOMBRES</label>
          <input
            pInputText
            id="c-nombres"
            formControlName="nombres"
            class="w-full"
            [invalid]="invalido('nombres')"
            [attr.aria-invalid]="invalido('nombres') || null"
            [attr.aria-describedby]="invalido('nombres') ? 'c-nombres-error' : null"
            data-testid="nombres"
          />
          @if (invalido('nombres')) {
            <p-message id="c-nombres-error" severity="error" variant="simple" size="small">{{ error('nombres') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="c-apellidos" class="text-sm font-medium">APELLIDOS</label>
          <input
            pInputText
            id="c-apellidos"
            formControlName="apellidos"
            class="w-full"
            [invalid]="invalido('apellidos')"
            [attr.aria-invalid]="invalido('apellidos') || null"
            [attr.aria-describedby]="invalido('apellidos') ? 'c-apellidos-error' : null"
            data-testid="apellidos"
          />
          @if (invalido('apellidos')) {
            <p-message id="c-apellidos-error" severity="error" variant="simple" size="small">{{ error('apellidos') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="c-dni" class="text-sm font-medium">DNI</label>
          <input
            pInputText
            id="c-dni"
            formControlName="dni"
            maxlength="8"
            inputmode="numeric"
            (input)="filtrarDigitos('dni', $event)"
            class="w-full"
            [invalid]="invalido('dni')"
            [attr.aria-invalid]="invalido('dni') || null"
            [attr.aria-describedby]="invalido('dni') ? 'c-dni-error' : null"
            data-testid="dni"
          />
          @if (invalido('dni')) {
            <p-message id="c-dni-error" severity="error" variant="simple" size="small">{{ error('dni') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="c-telefono" class="text-sm font-medium">TELEFONO</label>
          <input
            pInputText
            id="c-telefono"
            formControlName="telefono"
            inputmode="numeric"
            (input)="filtrarDigitos('telefono', $event)"
            class="w-full"
            [invalid]="invalido('telefono')"
            [attr.aria-invalid]="invalido('telefono') || null"
            [attr.aria-describedby]="invalido('telefono') ? 'c-telefono-error' : null"
            data-testid="telefono"
          />
          @if (invalido('telefono')) {
            <p-message id="c-telefono-error" severity="error" variant="simple" size="small">{{ error('telefono') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="c-email" class="text-sm font-medium">EMAIL</label>
          <input pInputText id="c-email" formControlName="email" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="c-vehiculo" class="text-sm font-medium">VEHICULO ASIGNADO (Tracto/Bombona/Marca)</label>
          <p-select
            inputId="c-vehiculo"
            formControlName="vehiculo"
            [options]="vehiculos()"
            optionLabel="etiqueta"
            dataKey="id"
            (onChange)="seleccionarVehiculo($event.value)"
            placeholder="Seleccione"
            appendTo="body"
            class="w-full"
            [pt]="{
              label: {
                'aria-describedby': invalido('vehiculo') ? 'c-vehiculo-error' : null,
                'aria-invalid': invalido('vehiculo') || null,
              },
            }"
            [invalid]="invalido('vehiculo')"
            data-testid="vehiculo"
          />
          @if (invalido('vehiculo')) {
            <p-message id="c-vehiculo-error" severity="error" variant="simple" size="small">{{ error('vehiculo') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="c-certificado" class="text-sm font-medium">NRO. CERT. INSCRIPCION</label>
          <input
            pInputText
            id="c-certificado"
            formControlName="certificado"
            class="w-full"
            [invalid]="invalido('certificado')"
            [attr.aria-invalid]="invalido('certificado') || null"
            [attr.aria-describedby]="invalido('certificado') ? 'c-certificado-error' : null"
            data-testid="certificado"
          />
          @if (invalido('certificado')) {
            <p-message id="c-certificado-error" severity="error" variant="simple" size="small">{{ error('certificado') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="c-licencia" class="text-sm font-medium">NRO. LICENCIA CONDUCIR</label>
          <input
            pInputText
            id="c-licencia"
            formControlName="licencia"
            class="w-full"
            [invalid]="invalido('licencia')"
            [attr.aria-invalid]="invalido('licencia') || null"
            [attr.aria-describedby]="invalido('licencia') ? 'c-licencia-error' : null"
            data-testid="licencia"
          />
          @if (invalido('licencia')) {
            <p-message id="c-licencia-error" severity="error" variant="simple" size="small">{{ error('licencia') }}</p-message>
          }
        </div>
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

  readonly choferes = signal<ChoferFila[]>([]);
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

  readonly columnas: ColumnaTabla<ChoferFila>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'nombres', titulo: 'Nombres' },
    { campo: 'apellidos', titulo: 'Apellidos' },
    { campo: 'dni', titulo: 'DNI', ancho: '8rem' },
    { campo: 'licencia', titulo: 'Licencia Conductor' },
    {
      campo: 'vehiculoTexto',
      titulo: 'Vehiculo asignado (tracto / bombona)',
    },
  ];

  readonly acciones = [accionEditar<ChoferFila>(), accionEliminar<ChoferFila>()];

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
      const datos = await firstValueFrom(this.servicio.listarTodosLosChoferes(1));
      this.choferes.set(
        datos.map((ch) => ({ ...ch, vehiculoTexto: `${ch.vehiculo?.placaTracto ?? ''} / ${ch.vehiculo?.placaBombona ?? ''}` })),
      );
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

  async alAccion({ accion, fila }: EventoAccionTabla<ChoferFila>): Promise<void> {
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

  /** Como `validaDigitos` de v1: solo admite dígitos al teclear y al pegar. */
  filtrarDigitos(nombre: 'dni' | 'telefono', evento: Event): void {
    const el = evento.target as HTMLInputElement;
    const limpio = soloDigitos(el.value);
    if (limpio !== el.value) {
      el.value = limpio;
      this.form.controls[nombre].setValue(limpio);
    }
  }

  invalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  error(nombre: string): string {
    const e = this.form.get(nombre)?.errors;
    if (!e) return '';
    if (e['required']) return 'Campo requerido';
    if (e['maxlength']) return 'Máximo 8 dígitos';
    if (e['digits']) return 'Solo dígitos';
    return 'Valor no válido';
  }

  private avisarError(err: unknown): void {
    const cuerpo = err instanceof HttpErrorResponse ? (err.error as Partial<ErrorResponse> | null) : null;
    this.avisos.error('Error', cuerpo?.errorMessage || MENSAJE_GENERICO);
  }
}
