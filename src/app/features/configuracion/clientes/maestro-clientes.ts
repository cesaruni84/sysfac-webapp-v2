import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { SessionService } from '../../../core/auth';
import { Cliente } from '../../../core/models';
import type { ErrorResponse, TipoDocPersona } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ClienteService, TiposGenericosService } from '../../../core/services';
import { correo, soloDigitos } from '../../../core/validators';
import {
  DialogoCrud,
  Tabla,
  TablaCelda,
  type AccionTabla,
  type ColumnaTabla,
  type EventoAccionTabla,
} from '../../../shared/ui';

/** Mensaje genérico de v1 cuando el backend no devuelve `errorMessage`. */
export const MENSAJE_ERROR_GENERICO = 'Ocurrió un error inesperado!!, intenta nuevamente.';

/** Cliente con la glosa del tipo de documento calculada para la grilla. */
type FilaCliente = Cliente & { tipoDocGlosa: string };

interface FormularioCliente {
  tipoDocumento: FormControl<number>;
  ruc: FormControl<string>;
  nombre: FormControl<string>;
  direccion: FormControl<string>;
  telefono: FormControl<string>;
  email: FormControl<string>;
  distrito: FormControl<string>;
  provincia: FormControl<string>;
  departamento: FormControl<string>;
}

/** Maestro de clientes (`maestro-clientes` + `cliente-popup` de v1). */
@Component({
  selector: 'app-maestro-clientes',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    Tabla,
    TablaCelda,
    DialogoCrud,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla
      [filas]="filas()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      anchoMinimo="80rem"
      (accion)="alAccion($event)"
    >
      <p-button
        appTablaBarra
        label="Nuevo Registro"
        icon="pi pi-plus"
        data-testid="nuevo"
        (onClick)="abrir()"
      />
      <ng-template appTablaCelda="item" [tipar]="filas()" let-i="indice">{{ i + 1 }}</ng-template>
    </app-tabla>

    <app-dialogo-crud
      [(visible)]="dialogoVisible"
      [titulo]="editando() ? 'Actualizar Cliente' : 'Nuevo Cliente'"
      icono="pi pi-user"
      [guardando]="guardando()"
      [guardarDeshabilitado]="form.invalid"
      (guardar)="guardar()"
    >
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-6">
        <div class="flex flex-col gap-1 sm:col-span-2">
          <label id="tipoDocumento-label" for="tipoDocumento" class="text-sm font-medium">TIPO DE DOCUMENTO</label>
          <p-select
            inputId="tipoDocumento"
            ariaLabelledBy="tipoDocumento-label"
            formControlName="tipoDocumento"
            [options]="tiposDocumento"
            optionLabel="descripcion"
            optionValue="id"
            appendTo="body"
            data-testid="tipo-documento"
          />
        </div>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium">DOCUMENTO</span>
          <input pInputText formControlName="ruc" inputmode="numeric" (input)="filtrarDocumento($event)"
            data-testid="ruc"
            [invalid]="invalido('ruc')"
            [attr.aria-invalid]="invalido('ruc') || null"
            [attr.aria-describedby]="invalido('ruc') ? 'ruc-error' : null"
          />
          @if (invalido('ruc')) {
            <p-message id="ruc-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
          }
        </label>
        <label class="flex flex-col gap-1 sm:col-span-6">
          <span class="text-sm font-medium">RAZON SOCIAL / NOMBRE</span>
          <input
            pInputText
            formControlName="nombre"
            data-testid="nombre"
            [invalid]="invalido('nombre')"
            [attr.aria-invalid]="invalido('nombre') || null"
            [attr.aria-describedby]="invalido('nombre') ? 'nombre-error' : null"
          />
          @if (invalido('nombre')) {
            <p-message id="nombre-error" severity="error" variant="simple" size="small">* REQUERIDO</p-message>
          }
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium">TELEFONO</span>
          <input pInputText formControlName="telefono" data-testid="telefono" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium">EMAIL</span>
          <input
            pInputText
            formControlName="email"
            data-testid="email"
            [invalid]="invalido('email')"
            [attr.aria-invalid]="invalido('email') || null"
            [attr.aria-describedby]="invalido('email') ? 'email-error' : null"
          />
          @if (invalido('email')) {
            <p-message id="email-error" severity="error" variant="simple" size="small">* FORMATO INCORRECTO</p-message>
          }
        </label>
        <label class="flex flex-col gap-1 sm:col-span-6">
          <span class="text-sm font-medium">DIRECCION</span>
          <input pInputText formControlName="direccion" data-testid="direccion" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium">DEPARTAMENTO</span>
          <input pInputText formControlName="departamento" data-testid="departamento" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium">PROVINCIA</span>
          <input pInputText formControlName="provincia" data-testid="provincia" />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium">DISTRITO</span>
          <input pInputText formControlName="distrito" data-testid="distrito" />
        </label>
      </form>
    </app-dialogo-crud>
  `,
})
export class MaestroClientes {
  private readonly servicio = inject(ClienteService);
  private readonly avisos = inject(NotificacionService);
  private readonly sesion = inject(SessionService);

  readonly tiposDocumento: TipoDocPersona[] = inject(TiposGenericosService)
    .retornarTiposDocPersona()
    .map((t) => ({ ...t, descripcion: (t.descripcion ?? '').trim() }));

  readonly clientes = signal<Cliente[]>([]);
  /** Filas de la grilla: cliente + glosa del tipo de documento (solo para mostrar y buscar; no se envía). */
  readonly filas = computed<FilaCliente[]>(() =>
    this.clientes().map((c) => ({ ...c, tipoDocGlosa: this.glosaTipoDoc(c.tipoDoc) })),
  );
  readonly cargando = signal(false);
  readonly dialogoVisible = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Cliente | null>(null);

  readonly form = new FormGroup<FormularioCliente>({
    tipoDocumento: new FormControl(1, { nonNullable: true, validators: Validators.required }),
    ruc: new FormControl('', { nonNullable: true, validators: Validators.required }),
    nombre: new FormControl('', { nonNullable: true, validators: Validators.required }),
    direccion: new FormControl('', { nonNullable: true }),
    telefono: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: correo }),
    distrito: new FormControl('', { nonNullable: true }),
    provincia: new FormControl('', { nonNullable: true }),
    departamento: new FormControl('', { nonNullable: true }),
  });

  readonly columnas: ColumnaTabla<FilaCliente>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'tipoDocGlosa', id: 'tipoDoc', titulo: 'Tipo Doc', ancho: '7rem' },
    { campo: 'ruc', titulo: 'Nro. Documento', ancho: '10rem' },
    { campo: 'razonSocial', titulo: 'Razón Social', ancho: '18rem' },
    { campo: 'direccion', titulo: 'Dirección', ancho: '20rem' },
    { campo: 'distrito', titulo: 'Distrito' },
    { campo: 'provincia', titulo: 'Provincia' },
    { campo: 'departamento', titulo: 'Departamento' },
  ];

  /** v1 solo ofrece "Consultar" (abre el popup de edición); la baja está deshabilitada. */
  readonly acciones: AccionTabla<FilaCliente>[] = [
    { id: 'editar', icono: 'pi pi-search', tooltip: 'Consultar', severidad: 'info' },
  ];

  constructor() {
    void this.listar();
  }

  glosaTipoDoc(id: number | undefined | null): string {
    if (!id) return '';
    return this.tiposDocumento.find((t) => t.id === id)?.descripcion ?? '';
  }

  async listar(): Promise<void> {
    this.cargando.set(true);
    try {
      const idEmpresa = this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;
      this.clientes.set(await firstValueFrom(this.servicio.listarClientesPorEmpresa(idEmpresa)));
    } catch (e) {
      this.avisos.error('Error', mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Como `validaDigitos` de v1, pero limpia lo escrito o pegado (solo dígitos, máximo 12). */
  filtrarDocumento(evento: Event): void {
    const el = evento.target as HTMLInputElement;
    const limpio = soloDigitos(el.value).slice(0, 12);
    if (limpio !== el.value) {
      el.value = limpio;
      this.form.controls.ruc.setValue(limpio);
    }
  }

  invalido(campo: keyof FormularioCliente): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  abrir(cliente?: Cliente): void {
    this.editando.set(cliente ?? null);
    this.form.reset({
      tipoDocumento: cliente?.tipoDoc || 1,
      ruc: cliente?.ruc || '',
      nombre: cliente?.razonSocial || '',
      direccion: cliente?.direccion || '',
      telefono: cliente?.telefono || '',
      email: cliente?.email || '',
      distrito: cliente?.distrito || '',
      provincia: cliente?.provincia || '',
      departamento: cliente?.departamento || '',
    });
    this.dialogoVisible.set(true);
  }

  alAccion({ accion, fila }: EventoAccionTabla<FilaCliente>): void {
    if (accion === 'editar') this.abrir(fila);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    const original = this.editando();
    const v = this.form.getRawValue();
    // Mismo objeto que arma v1 (nombreComercial fijo '?').
    const cliente = new Cliente();
    cliente.tipoDoc = v.tipoDocumento;
    cliente.ruc = v.ruc;
    cliente.razonSocial = v.nombre;
    cliente.nombreComercial = '?';
    cliente.telefono = v.telefono;
    cliente.email = v.email;
    cliente.direccion = v.direccion;
    cliente.distrito = v.distrito;
    cliente.provincia = v.provincia;
    cliente.departamento = v.departamento;
    if (original) cliente.id = original.id;

    this.guardando.set(true);
    try {
      await firstValueFrom(
        original ? this.servicio.actualizarCliente(cliente) : this.servicio.registrarCliente(cliente),
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

/** Texto para el usuario: `errorMessage` del backend o el genérico de v1. */
function mensajeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const cuerpo = e.error as Partial<ErrorResponse> | null;
    if (cuerpo && typeof cuerpo === 'object' && cuerpo.errorMessage) return cuerpo.errorMessage;
  }
  return MENSAJE_ERROR_GENERICO;
}
