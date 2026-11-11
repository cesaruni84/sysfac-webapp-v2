import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';

import { Cliente, ErrorResponse, Factoria } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ClienteService, FactoriaService } from '../../../core/services';
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

/** Maestro de Plantas (factorías). Port de `maestro-factoria` de v1. */
@Component({
  selector: 'app-maestro-factorias',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule, Tabla, TablaCelda, DialogoCrud],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla [filas]="factorias()" [columnas]="columnas" [acciones]="acciones" [cargando]="cargando()" (accion)="alAccion($event)">
      <p-button appTablaBarra label="Nuevo Registro" icon="pi pi-plus" (onClick)="abrir()" />
      <ng-template appTablaCelda="item" [tipar]="factorias()" let-i="indice">{{ i + 1 }}</ng-template>
    </app-tabla>

    <app-dialogo-crud
      [(visible)]="dialogoVisible"
      [titulo]="editando() ? 'Actualizar Planta' : 'Nueva Planta'"
      icono="pi pi-building"
      [guardando]="guardando()"
      [guardarDeshabilitado]="form.invalid"
      (guardar)="guardar()"
    >
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid grid-cols-1 gap-4 sm:grid-cols-10">
        <div class="flex flex-col gap-1 sm:col-span-7">
          <label for="f-cliente" class="text-sm font-medium">CLIENTE</label>
          <p-select
            inputId="f-cliente"
            formControlName="cliente"
            [options]="clientes()"
            optionLabel="etiqueta"
            dataKey="id"
            [filter]="true"
            filterBy="etiqueta"
            placeholder="Seleccione"
            appendTo="body"
            (onChange)="seleccionarCliente($event.value)"
            data-testid="cliente"
          />
        </div>
        <label class="flex flex-col gap-1 sm:col-span-3">
          <span class="text-sm font-medium">RUC</span>
          <input pInputText formControlName="ruc" data-testid="ruc" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-3">
          <span class="text-sm font-medium">CODIGO</span>
          <input pInputText formControlName="codigo" data-testid="codigo" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-7">
          <span class="text-sm font-medium">NOMBRE PLANTA</span>
          <input pInputText formControlName="nombre" data-testid="nombre" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-10">
          <span class="text-sm font-medium">DIRECCION</span>
          <input pInputText formControlName="direccion" data-testid="direccion" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-5">
          <span class="text-sm font-medium">DISTRITO</span>
          <input pInputText formControlName="distrito" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-5">
          <span class="text-sm font-medium">PROVINCIA</span>
          <input pInputText formControlName="provincia" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-5">
          <span class="text-sm font-medium">DEPARTAMENTO</span>
          <input pInputText formControlName="departamento" />
        </label>
        <div class="flex items-center gap-2 sm:col-span-5">
          <p-toggleswitch formControlName="estado" inputId="f-estado" />
          <label for="f-estado" class="text-sm font-medium">Activo</label>
        </div>
      </form>
    </app-dialogo-crud>
  `,
})
export class MaestroFactorias implements OnInit {
  private readonly servicio = inject(FactoriaService);
  private readonly clienteService = inject(ClienteService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(NotificacionService);

  readonly factorias = signal<Factoria[]>([]);
  readonly clientes = signal<(Cliente & { etiqueta: string })[]>([]);
  readonly cargando = signal(false);
  readonly dialogoVisible = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Factoria | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    cliente: [null as Cliente | null, Validators.required],
    ruc: ['', Validators.required],
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    direccion: ['', Validators.required],
    distrito: [''],
    provincia: [''],
    departamento: [''],
    estado: [true],
  });

  readonly columnas: ColumnaTabla<Factoria>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'codigo', titulo: 'Código', ancho: '6rem' },
    { campo: 'cliente.ruc', titulo: 'RUC', ancho: '8rem' },
    { campo: 'refLarga2', titulo: 'Razón Social / Planta' },
    { campo: 'distrito', titulo: 'Distrito' },
    { campo: 'provincia', titulo: 'Provincia' },
    { campo: 'departamento', titulo: 'Departamento' },
    {
      campo: 'estado',
      titulo: 'Estado',
      tipo: 'tag',
      tag: (v) => (Number(v) === 0 ? { texto: 'Activo', severidad: 'success' } : { texto: 'Inactivo', severidad: 'secondary' }),
    },
  ];

  readonly acciones = [accionEditar<Factoria>(), accionEliminar<Factoria>()];

  ngOnInit(): void {
    void this.listar();
    // v1: combo de clientes de la empresa 1.
    this.clienteService.listarClientesPorEmpresa(1).subscribe({
      next: (data) => this.clientes.set(data.map((c) => ({ ...c, etiqueta: `RUC ${c.ruc} - ${c.razonSocial}` }))),
      error: (err: HttpErrorResponse) => this.avisarError(err),
    });
  }

  async listar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.factorias.set(await firstValueFrom(this.servicio.listarTodasLasFactorias('O')));
    } catch (err) {
      this.avisarError(err);
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(factoria?: Factoria): void {
    this.editando.set(factoria ?? null);
    this.form.reset({
      cliente: factoria?.cliente ?? null,
      ruc: factoria?.ruc || factoria?.cliente?.ruc || '',
      codigo: factoria?.codigo ?? '',
      nombre: factoria?.nombre ?? '',
      direccion: factoria?.direccion ?? '',
      distrito: factoria?.distrito ?? '',
      provincia: factoria?.provincia ?? '',
      departamento: factoria?.departamento ?? '',
      estado: factoria ? Number(factoria.estado) === 0 : true,
    });
    this.dialogoVisible.set(true);
  }

  seleccionarCliente(cliente: Cliente | null): void {
    this.form.patchValue({ ruc: cliente?.ruc ?? '' });
  }

  async alAccion({ accion, fila }: EventoAccionTabla<Factoria>): Promise<void> {
    if (accion === 'editar') {
      this.abrir(fila);
    } else if (accion === 'eliminar') {
      const ok = await this.confirmacion.confirmar({
        mensaje: `Confirma eliminar el registro: ${fila.refLarga2}?`,
        aceptar: 'Eliminar',
        peligro: true,
      });
      if (!ok) return;
      this.cargando.set(true);
      try {
        const resp = await firstValueFrom(this.servicio.eliminarFactoria(fila));
        this.avisos.info(resp.alertMessage);
        await this.listar();
      } catch (err) {
        this.cargando.set(false);
        this.avisarError(err);
      }
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) return;
    const v = this.form.getRawValue();
    const original = this.editando();
    // Quita la etiqueta de presentación del combo para que el cliente enviado sea el de v1.
    const cliente: Cliente & { etiqueta?: string } = { ...v.cliente };
    delete cliente.etiqueta;
    // JSON idéntico al de v1.
    const factoria: Factoria = {
      cliente: v.cliente ? cliente : undefined,
      codigo: v.codigo,
      ruc: v.cliente?.ruc,
      nombre: v.nombre,
      direccion: v.direccion,
      distrito: v.distrito,
      provincia: v.provincia,
      departamento: v.departamento,
      estado: v.estado ? 0 : 1,
      referencia: '?',
      tipo: 'O',
    };
    if (original) factoria.id = original.id;
    this.guardando.set(true);
    try {
      await firstValueFrom(original ? this.servicio.actualizarFactoria(factoria) : this.servicio.registrarFactoria(factoria));
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
