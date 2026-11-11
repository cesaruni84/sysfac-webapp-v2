import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import type { ErrorResponse, Vehiculo } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { VehiculoService } from '../../../core/services';
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

/** Maestro de Vehículos. Port de `maestro-vehiculos` de v1. */
@Component({
  selector: 'app-maestro-vehiculos',
  imports: [ReactiveFormsModule, MessageModule, ButtonModule, InputTextModule, ToggleSwitchModule, Tabla, TablaCelda, DialogoCrud],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla [filas]="vehiculos()" [columnas]="columnas" [acciones]="acciones" [cargando]="cargando()" (accion)="alAccion($event)">
      <p-button appTablaBarra label="Nuevo Registro" icon="pi pi-plus" (onClick)="abrir()" />
      <ng-template appTablaCelda="item" [tipar]="vehiculos()" let-i="indice">{{ i + 1 }}</ng-template>
    </app-tabla>

    <app-dialogo-crud
      [(visible)]="dialogoVisible"
      [titulo]="editando() ? 'Actualizar Vehículo' : 'Nuevo Vehículo'"
      icono="pi pi-truck"
      [guardando]="guardando()"
      [guardarDeshabilitado]="form.invalid"
      (guardar)="guardar()"
    >
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label for="v-tracto" class="text-sm font-medium">PLACA TRACTO</label>
          <input
            pInputText
            id="v-tracto"
            formControlName="tracto"
            class="w-full"
            [invalid]="invalido('tracto')"
            [attr.aria-invalid]="invalido('tracto') || null"
            [attr.aria-describedby]="invalido('tracto') ? 'v-tracto-error' : null"
            data-testid="tracto"
          />
          @if (invalido('tracto')) {
            <p-message id="v-tracto-error" severity="error" variant="simple" size="small">{{ error('tracto') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="v-bombona" class="text-sm font-medium">PLACA BOMBONA</label>
          <input
            pInputText
            id="v-bombona"
            formControlName="bombona"
            class="w-full"
            [invalid]="invalido('bombona')"
            [attr.aria-invalid]="invalido('bombona') || null"
            [attr.aria-describedby]="invalido('bombona') ? 'v-bombona-error' : null"
            data-testid="bombona"
          />
          @if (invalido('bombona')) {
            <p-message id="v-bombona-error" severity="error" variant="simple" size="small">{{ error('bombona') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="v-marca" class="text-sm font-medium">MARCA/MODELO</label>
          <input
            pInputText
            id="v-marca"
            formControlName="marca"
            class="w-full"
            [invalid]="invalido('marca')"
            [attr.aria-invalid]="invalido('marca') || null"
            [attr.aria-describedby]="invalido('marca') ? 'v-marca-error' : null"
            data-testid="marca"
          />
          @if (invalido('marca')) {
            <p-message id="v-marca-error" severity="error" variant="simple" size="small">{{ error('marca') }}</p-message>
          }
        </div>
        <div class="flex flex-col gap-1">
          <label for="v-certificado" class="text-sm font-medium">CERTIFICADO MTC</label>
          <input
            pInputText
            id="v-certificado"
            formControlName="certificado"
            class="w-full"
            [invalid]="invalido('certificado')"
            [attr.aria-invalid]="invalido('certificado') || null"
            [attr.aria-describedby]="invalido('certificado') ? 'v-certificado-error' : null"
            data-testid="certificado"
          />
          @if (invalido('certificado')) {
            <p-message id="v-certificado-error" severity="error" variant="simple" size="small">{{ error('certificado') }}</p-message>
          }
        </div>
        <div class="flex items-center gap-2">
          <p-toggleswitch formControlName="estado" inputId="v-estado" />
          <label for="v-estado" class="text-sm font-medium">Operativo</label>
        </div>
      </form>
    </app-dialogo-crud>
  `,
})
export class MaestroVehiculos implements OnInit {
  private readonly servicio = inject(VehiculoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(NotificacionService);

  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly cargando = signal(false);
  readonly dialogoVisible = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Vehiculo | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    tracto: ['', Validators.required],
    bombona: ['', Validators.required],
    marca: ['', Validators.required],
    certificado: ['', Validators.required],
    estado: [true],
  });

  readonly columnas: ColumnaTabla<Vehiculo>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'placaTracto', titulo: 'Placa Tracto' },
    { campo: 'placaBombona', titulo: 'Placa Bombona' },
    { campo: 'modelo', titulo: 'Marca' },
    { campo: 'licencia', titulo: 'Certificado MTC' },
    { campo: 'fechaRegistro', titulo: 'Fecha Registro Sist.', tipo: 'fecha' },
    {
      campo: 'estado',
      titulo: 'Estado Vehiculo',
      tipo: 'tag',
      tag: (v) => (Number(v) === 0 ? { texto: 'Operativo', severidad: 'success' } : { texto: 'Inoperativo', severidad: 'secondary' }),
    },
  ];

  readonly acciones = [accionEditar<Vehiculo>(), accionEliminar<Vehiculo>()];

  ngOnInit(): void {
    void this.listar();
  }

  async listar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.vehiculos.set(await firstValueFrom(this.servicio.listarTodosLosVehiculosPorEmpresa(1)));
    } catch (err) {
      this.avisarError(err);
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(vehiculo?: Vehiculo): void {
    this.editando.set(vehiculo ?? null);
    this.form.reset({
      tracto: vehiculo?.placaTracto ?? '',
      bombona: vehiculo?.placaBombona ?? '',
      marca: vehiculo?.modelo ?? '',
      certificado: vehiculo?.licencia ?? '',
      estado: vehiculo ? Number(vehiculo.estado) === 0 : true,
    });
    this.dialogoVisible.set(true);
  }

  async alAccion({ accion, fila }: EventoAccionTabla<Vehiculo>): Promise<void> {
    if (accion === 'editar') {
      this.abrir(fila);
    } else if (accion === 'eliminar') {
      // v1 no elimina vehículos: confirma y avisa "Opción deshabilitada".
      const ok = await this.confirmacion.confirmar({
        mensaje: `Confirma eliminar el registro: ${fila.placaTracto} / ${fila.placaBombona}?`,
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
    // JSON idéntico al de v1.
    const vehiculo: Vehiculo = {
      placaTracto: v.tracto,
      placaBombona: v.bombona,
      modelo: v.marca,
      licencia: v.certificado,
      garantia: 'S',
      estado: v.estado ? 0 : 1,
    };
    if (original) vehiculo.id = original.id;
    this.guardando.set(true);
    try {
      await firstValueFrom(original ? this.servicio.actualizarVehiculo(vehiculo) : this.servicio.registrarVehiculo(vehiculo));
      this.dialogoVisible.set(false);
      this.avisos.exito(original ? 'Registro actualizado correctamente !' : 'Registro añadido correctamente !');
      await this.listar();
    } catch (err) {
      this.avisarError(err);
    } finally {
      this.guardando.set(false);
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
