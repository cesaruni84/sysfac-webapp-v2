import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { Categoria, Producto } from '../../../core/models';
import type { ErrorResponse } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ProductoService } from '../../../core/services';
import { numero } from '../../../core/validators';
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

/** Tipos de producto (combo fijo de v1; la descripción del popup lleva un espacio inicial que aquí se omite). */
export const TIPOS_PRODUCTO: { id: number; codigo: string; descripcion: string }[] = [
  { id: 1, codigo: '001', descripcion: 'BIEN' },
  { id: 2, codigo: '002', descripcion: 'SERVICIO' },
];

/** Glosa del tipo de producto en la grilla (`retornarGlosa` de v1: vacío si no hay id). */
export function glosaTipoProducto(id: number | undefined | null): string {
  if (!id) return '';
  return TIPOS_PRODUCTO.find((t) => t.id === id)?.descripcion ?? '';
}

/** Producto con la glosa del tipo calculada para la grilla. */
type FilaProducto = Producto & { tipoGlosa: string };

interface FormularioProducto {
  tipoProducto: FormControl<number>;
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  stock: FormControl<number | null>;
  precio: FormControl<number | null>;
}

/** Maestro de productos (`maestro-productos` + `productos-popup` de v1). */
@Component({
  selector: 'app-maestro-productos',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
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
      [titulo]="editando() ? 'Actualizar Producto' : 'Nuevo Producto'"
      icono="pi pi-box"
      ancho="46.25rem"
      [guardando]="guardando()"
      [guardarDeshabilitado]="form.invalid"
      (guardar)="guardar()"
    >
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-6">
        <div class="flex flex-col gap-1 sm:col-span-2">
          <label for="tipoProducto" class="text-sm font-medium">TIPO DE PRODUCTO</label>
          <p-select
            inputId="tipoProducto"
            formControlName="tipoProducto"
            [options]="tipos"
            optionLabel="descripcion"
            optionValue="id"
            appendTo="body"
            data-testid="tipo-producto"
          />
        </div>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-sm font-medium">CODIGO</span>
          <input pInputText formControlName="codigo" maxlength="25" data-testid="codigo" />
          @if (invalido('codigo')) {
            <small class="text-red-500">* REQUERIDO</small>
          }
        </label>
        <label class="flex flex-col gap-1 sm:col-span-6">
          <span class="text-sm font-medium">NOMBRE</span>
          <input pInputText formControlName="nombre" data-testid="nombre" />
          @if (invalido('nombre')) {
            <small class="text-red-500">* REQUERIDO</small>
          }
        </label>
        <label class="flex flex-col gap-1 sm:col-span-6">
          <span class="text-sm font-medium">DESCRIPCION</span>
          <input pInputText formControlName="descripcion" data-testid="descripcion" />
        </label>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <label for="stock" class="text-sm font-medium">STOCK</label>
          <p-inputnumber
            inputId="stock"
            formControlName="stock"
            [minFractionDigits]="0"
            [maxFractionDigits]="4"
            [useGrouping]="false"
            data-testid="stock"
          />
          @if (invalido('stock')) {
            <small class="text-red-500">* FORMATO INCORRECTO</small>
          }
        </div>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <label for="precio" class="text-sm font-medium">PRECIO</label>
          <p-inputnumber
            inputId="precio"
            formControlName="precio"
            [minFractionDigits]="0"
            [maxFractionDigits]="4"
            [useGrouping]="false"
            data-testid="precio"
          />
          @if (invalido('precio')) {
            <small class="text-red-500">* FORMATO INCORRECTO</small>
          }
        </div>
      </form>
    </app-dialogo-crud>
  `,
})
export class MaestroProductos {
  private readonly servicio = inject(ProductoService);
  private readonly avisos = inject(NotificacionService);

  readonly tipos = TIPOS_PRODUCTO;
  readonly productos = signal<Producto[]>([]);
  /** Filas de la grilla: producto + glosa del tipo (solo para mostrar y buscar; no se envía). */
  readonly filas = computed<FilaProducto[]>(() =>
    this.productos().map((p) => ({ ...p, tipoGlosa: glosaTipoProducto(p.categoria?.id) })),
  );
  readonly cargando = signal(false);
  readonly dialogoVisible = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Producto | null>(null);

  readonly form = new FormGroup<FormularioProducto>({
    tipoProducto: new FormControl(1, { nonNullable: true, validators: Validators.required }),
    codigo: new FormControl('', { nonNullable: true, validators: Validators.required }),
    nombre: new FormControl('', { nonNullable: true, validators: Validators.required }),
    descripcion: new FormControl('', { nonNullable: true }),
    stock: new FormControl<number | null>(0, numero),
    precio: new FormControl<number | null>(0, numero),
  });

  readonly columnas: ColumnaTabla<FilaProducto>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'tipoGlosa', id: 'tipo', titulo: 'Tipo' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'codigo', titulo: 'Código' },
    { campo: 'stock', titulo: 'Stock', tipo: 'numero', digitos: '1.2-2', alineacion: 'izquierda' },
    { campo: 'fechaIngreso', titulo: 'Fecha Registro', tipo: 'fecha' },
  ];

  /** v1 solo ofrece "Consultar" (abre el popup de edición); la baja está deshabilitada. */
  readonly acciones: AccionTabla<FilaProducto>[] = [
    { id: 'editar', icono: 'pi pi-search', tooltip: 'Consultar', severidad: 'info' },
  ];

  constructor() {
    void this.listar();
  }

  async listar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.productos.set(await firstValueFrom(this.servicio.listarComboProductos()));
    } catch (e) {
      this.avisos.error('Error', mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  invalido(campo: keyof FormularioProducto): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.dirty || c.touched);
  }

  abrir(producto?: Producto): void {
    this.editando.set(producto ?? null);
    this.form.reset({
      tipoProducto: producto?.categoria?.id || 1,
      codigo: producto?.codigo || '',
      nombre: producto?.nombre || '',
      descripcion: producto?.descripcion || '',
      stock: producto?.stock || 0,
      precio: producto?.precio || 0,
    });
    this.dialogoVisible.set(true);
  }

  alAccion({ accion, fila }: EventoAccionTabla<FilaProducto>): void {
    if (accion === 'editar') this.abrir(fila);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    const original = this.editando();
    const v = this.form.getRawValue();
    // Mismo objeto que arma v1 (categoria, codigo, nombre, descripcion, stock, precio [+ id]).
    const producto = new Producto();
    const categoria = new Categoria();
    categoria.id = v.tipoProducto;
    producto.categoria = categoria;
    producto.codigo = v.codigo;
    producto.nombre = v.nombre;
    producto.descripcion = v.descripcion;
    producto.stock = v.stock as number;
    producto.precio = v.precio as number;
    if (original) producto.id = original.id;

    this.guardando.set(true);
    try {
      await firstValueFrom(
        original ? this.servicio.actualizarProducto(producto) : this.servicio.registrarProducto(producto),
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
