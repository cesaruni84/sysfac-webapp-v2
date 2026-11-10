# `shared/ui`: componentes reutilizables (tarea 3.3)

Componentes de presentación sobre PrimeNG 21 para todas las pantallas de la Fase 4.
**No contienen lógica de negocio**: cálculos, totales, textos de estado y llamadas HTTP los hace la
pantalla con `core`.

| Pieza | Selector / servicio | Reemplaza en v1 |
| --- | --- | --- |
| Tabla genérica | `<app-tabla>` + `appTablaCelda`, `appTablaDetalle`, `[appTablaBarra]` | `ngx-datatable` |
| Diálogo CRUD | `<app-dialogo-crud>` | `MatDialog` de los `*-popup` |
| Confirmación | `ConfirmacionService.confirmar()` (+ `<app-confirmacion-host>` en el shell) | `AppConfirmService` |
| Carga global | `CargaGlobalService` (`core/carga`) (+ `<app-cargando-global>` en el shell) | `AppLoaderService` |
| Carga inline | `<app-cargando>` | `mat-spinner` / `mat-progress-bar` sueltos |
| Avisos (toast) | `NotificacionService` (`core/notifications`, ya montado en el shell) | `MatSnackBar` |

Importa siempre desde el índice:

```ts
import { Tabla, TablaCelda, TablaDetalle, DialogoCrud, ConfirmacionService, Cargando } from '../../shared/ui';
import { CargaGlobalService } from '../../core/carga';
import { NotificacionService } from '../../core/notifications';
```

Reglas de capas: `shared/ui` no importa de `features` ni de `layout`. Una pantalla (feature) puede
importar de `core` y de `shared/ui`.

---

## 1. Tabla genérica `<app-tabla>`

Envoltorio de `p-table` con columnas tipadas, paginación (cliente o servidor), buscador global,
filtros por columna, orden, selección, acciones por fila, plantillas por columna, detalle
expandible, fila de totales, estados vacío/cargando y botones de exportación.

### Inputs

| Input | Tipo | Por defecto | Notas |
| --- | --- | --- | --- |
| `columnas` | `ColumnaTabla<T>[]` | **requerido** | Ver tabla siguiente. |
| `filas` | `T[] \| null \| undefined` | `[]` | No se muta: la tabla ordena una copia. Reemplaza el arreglo (inmutable) para refrescar. |
| `clave` | `string` | `'id'` | Clave única de fila: necesaria para selección y detalle. |
| `cargando` | `boolean` | `false` | Overlay de carga sobre la tabla y deshabilita exportar. |
| `mensajeVacio` | `string` | `'No se encontraron registros.'` | |
| `anchoMinimo` | `string` | `'50rem'` | Por debajo aparece scroll horizontal (responsive). |
| `paginado` | `boolean` | `true` | |
| `filasPorPagina` | `number` | `10` (como v1) | |
| `opcionesFilasPorPagina` | `number[]` | `[5, 10, 25, 50]` | |
| `lazy` | `boolean` | `false` | Modo servidor: emite `(cargar)` y no pagina/ordena/filtra localmente. |
| `totalRegistros` | `number` | — | Solo con `lazy`. |
| `buscador` | `boolean` | `true` | Buscador global ("contiene", sin tildes ni mayúsculas). |
| `textoBuscador` | `string` | `'Buscar...'` | |
| `retardoFiltro` | `number` | `300` | ms tras teclear. |
| `modoSeleccion` | `'simple' \| 'multiple' \| null` | `null` | Simple: clic en la fila. Múltiple: checkboxes. |
| `acciones` | `AccionTabla<T>[]` | `[]` | Botones por fila. |
| `posicionAcciones` | `'inicio' \| 'fin'` | `'inicio'` (como v1) | |
| `tituloAcciones` | `string` | `'Acciones'` | |
| `totales` | `TotalesTabla \| null` | `null` | `{ [idColumna]: number \| string }`. La pantalla los calcula. |
| `etiquetaTotales` | `string` | `'Totales'` | Va en la primera celda libre del pie. |
| `formatosExportacion` | `('excel' \| 'pdf')[]` | `[]` | Botones "Exportar a Excel/PDF" en la barra. |

### Model, outputs y métodos

| Nombre | Tipo | Notas |
| --- | --- | --- |
| `[(seleccion)]` | `model<readonly T[]>` | Siempre un arreglo (en modo simple, 0 o 1 elemento). |
| `(accion)` | `{ accion: string; fila: T }` | `accion` es el `id` de la `AccionTabla`. |
| `(exportar)` | `{ formato: 'excel' \| 'pdf'; filas: T[] }` | Filas visibles **tras filtros y orden, de todas las páginas**. |
| `(cargar)` | `EventoCargaTabla` | Solo en `lazy`: `{ primero, filas, ordenCampo?, orden?, busqueda, filtros }`. Se emite al iniciar, al paginar, ordenar o filtrar. |
| `filasVisibles()` | `T[]` | Método público (vía `viewChild(Tabla)`). |
| `limpiarFiltros()` | `void` | Limpia buscador, filtros y orden. |

### `ColumnaTabla<T>`

| Propiedad | Tipo | Notas |
| --- | --- | --- |
| `campo` | `RutaCampo<T>` | Clave o ruta con punto, **tipada**: `'nombres'`, `'empresa.razonSocial'` (hasta 3 niveles). |
| `titulo` | `string` | |
| `tipo` | `'texto' \| 'numero' \| 'moneda' \| 'fecha' \| 'tag' \| 'plantilla'` | Por defecto `'texto'`. |
| `id` | `string` | Para plantilla y totales; por defecto `campo`. Úsalo si dos columnas comparten `campo`. |
| `ancho` | `string` | CSS (`'8rem'`). |
| `ordenable` | `boolean` | Por defecto `true`. |
| `filtrable` | `boolean` | Input "contiene" bajo la cabecera. Por defecto `false`. |
| `buscable` | `boolean` | Entra en el buscador global. Por defecto `true`. |
| `alineacion` | `'izquierda' \| 'centro' \| 'derecha'` | Por defecto: números a la derecha, tags al centro. |
| `formato` | `(valor, fila) => string` | Formato propio (gana sobre `tipo`). |
| `digitos` | `string` | `numero`: `'1.0-2'`; `moneda`: `'1.2-2'` (el `number: '1.2-2'` de v1). |
| `moneda` | `string \| (fila) => string` | Símbolo antepuesto (`'S/'`). Por defecto ninguno, como v1. |
| `formatoFecha` | `string` | Por defecto `'dd/MM/yyyy'` (como v1). |
| `tag` | `(valor, fila) => { texto, severidad? } \| null` | Para `tipo: 'tag'` (`p-tag`). |

> El buscador, los filtros y el orden trabajan sobre el **valor crudo** del campo (no el formateado):
> una fecha ISO `2021-03-15` no coincide con `15/03/2021`. Si una pantalla lo necesita, que agregue
> a la fila un campo de texto ya formateado y lo use como `campo`.

### `AccionTabla<T>`

`{ id, icono, tooltip, severidad?, visible?(fila), deshabilitada?(fila) }`.
Atajos: `accionVer()`, `accionEditar()`, `accionEliminar()` (íconos y tooltips de v1). Se combinan con
spread: `{ ...accionEliminar(), visible: (g) => g.estado === 0 }`.

### Plantillas

- **Celda**: `<ng-template appTablaCelda="<id o campo>" [tipar]="filas()" let-fila let-valor="valor" let-i="indice">`.
  `[tipar]` solo sirve para que `let-fila` quede tipado como `T` (pásale el mismo arreglo).
  Si existe una plantilla para la columna, se usa sea cual sea su `tipo`.
- **Detalle expandible**: `<ng-template appTablaDetalle [tipar]="filas()" let-fila let-i="indice">`.
  Su presencia agrega la columna con el botón de expandir. Requiere `clave` única.
- **Barra**: cualquier elemento con el atributo `appTablaBarra` se proyecta a la derecha de la barra
  (junto a los botones de exportar), p. ej. un botón "Nuevo registro".

### Exportación: patrón

La tabla **no genera archivos**. Emite `(exportar)` con las filas visibles y la pantalla llama al
reporte específico de `core/services/export` (los reportes de v1 son por pantalla, con columnas y
formatos propios):

```ts
async exportar({ formato, filas }: EventoExportarTabla<Liquidacion>) {
  if (formato === 'excel') {
    await this.carga.ejecutar(() => this.excel.generarReporteLiquidaciones(filas), 'Generando Excel');
  }
}
```

> Diferencia con v1: v1 exportaba **todas** las filas de la consulta (`this.rows`), ignorando el
> orden de la grilla (ngx-datatable no tenía buscador). v2 exporta lo que el usuario ve tras filtrar y
> ordenar. Si una pantalla necesita exportar todo, que ignore `filas` y use su propio arreglo.

---

## 2. Diálogo CRUD `<app-dialogo-crud>`

| Nombre | Tipo | Por defecto | Notas |
| --- | --- | --- | --- |
| `[(visible)]` | `model<boolean>` | `false` | |
| `titulo` | `string` | **requerido** | |
| `icono` | `string` | — | Clase de PrimeIcons junto al título. |
| `ancho` | `string` | `'52.5rem'` (840px de v1) | En pantallas < 960px: 90vw; < 640px: 100vw. |
| `guardando` | `boolean` | `false` | Spinner en Guardar, botones deshabilitados, sin X ni Escape. |
| `guardarDeshabilitado` | `boolean` | `false` | Normalmente `form.invalid`. |
| `textoGuardar` / `textoCancelar` | `string` | `'Guardar'` / `'Cancelar'` | |
| `(guardar)` | `void` | | Solo emite: **no cierra**. La pantalla cierra con `visible.set(false)` al terminar. |
| `(cancelar)` | `void` | | Cancelar, X o Escape: cierra y emite. |

El formulario se proyecta como contenido. El diálogo no se destruye al cerrarse: reinicia el
formulario (`form.reset(...)`) al abrirlo.

---

## 3. Confirmación `ConfirmacionService`

```ts
confirmar(opciones?: {
  titulo?: string;   // 'Confirmación' (v1)
  mensaje?: string;  // '¿Está seguro?'
  aceptar?: string;  // 'Aceptar'
  cancelar?: string; // 'Cancelar'
  peligro?: boolean; // botón rojo, ícono de alerta y foco en Cancelar
}): Promise<boolean>
```

Resuelve `true` al aceptar y `false` al cancelar, cerrar con la X o con Escape. Si se abre otra
confirmación con una pendiente, la anterior resuelve `false`. El mensaje se muestra como texto plano
(no HTML). Requiere `<app-confirmacion-host />` montado en el shell (una vez).

---

## 4. Carga

- **Inline** `<app-cargando mensaje="Cargando..." tamano="pequeno|normal|grande" [vertical]="true" />`:
  para una sección. Para la tabla basta con `[cargando]`.
- **Global** `CargaGlobalService` (`core/carga`), overlay a pantalla completa (`<app-cargando-global />`
  en el shell):
  - `abrir(mensaje = 'Procesando')`, `cerrar()`, `cerrarTodo()`.
  - `ejecutar(tarea: () => Promise<T>, mensaje?)`: abre, espera y cierra aunque falle.
  - Signals: `activo()`, `mensaje()`, `contador()`. Con llamadas anidadas sigue visible hasta el
    último `cerrar()` y muestra el mensaje más reciente.

---

## Ejemplo 1: pantalla de consulta (filtros + tabla + exportar)

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { SessionService } from '../../core/auth';
import { CargaGlobalService } from '../../core/carga';
import { EstadoLiquidacion, type Liquidacion } from '../../core/models';
import { NotificacionService } from '../../core/notifications';
import { ExcelService, LiquidacionService } from '../../core/services';
import {
  Tabla,
  TablaCelda,
  TablaDetalle,
  accionVer,
  type AccionTabla,
  type ColumnaTabla,
  type EventoAccionTabla,
  type EventoExportarTabla,
} from '../../shared/ui';

@Component({
  selector: 'app-consulta-liquidaciones',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, Tabla, TablaCelda, TablaDetalle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="filtros" (ngSubmit)="buscar()" class="mb-4 flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Nro. liquidación</span>
        <input pInputText formControlName="nroDoc" />
      </label>
      <p-button type="submit" label="Buscar" icon="pi pi-search" />
    </form>

    <app-tabla
      [filas]="liquidaciones()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      [formatosExportacion]="['excel']"
      [totales]="totales()"
      (accion)="alAccion($event)"
      (exportar)="exportar($event)"
    >
      <ng-template appTablaCelda="item" [tipar]="liquidaciones()" let-i="indice">{{ i + 1 }}</ng-template>
      <ng-template appTablaDetalle [tipar]="liquidaciones()" let-liq>
        <p class="m-0">Glosa: {{ liq.glosa }}</p>
      </ng-template>
    </app-tabla>
  `,
})
export class ConsultaLiquidaciones {
  private readonly servicio = inject(LiquidacionService);
  private readonly excel = inject(ExcelService);
  private readonly carga = inject(CargaGlobalService);
  private readonly avisos = inject(NotificacionService);
  private readonly sesion = inject(SessionService);

  readonly filtros = inject(NonNullableFormBuilder).group({ nroDoc: '' });
  readonly liquidaciones = signal<Liquidacion[]>([]);
  readonly cargando = signal(false);
  readonly totales = signal<{ importeTotal: number } | null>(null);

  readonly columnas: ColumnaTabla<Liquidacion>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'nrodoc', titulo: 'Nro. Liquidación', filtrable: true },
    { campo: 'fechaEmision', titulo: 'F. Emisión', tipo: 'fecha' },
    { campo: 'origen.refLarga1', titulo: 'Origen' },
    { campo: 'destino.refLarga1', titulo: 'Destino' },
    {
      campo: 'estado',
      titulo: 'Estado',
      tipo: 'tag',
      // El texto/severidad sale de core (sin reglas de negocio en el componente).
      tag: (v) => (v === EstadoLiquidacion.VIGENTE ? { texto: 'VIGENTE', severidad: 'success' } : { texto: 'VENCIDO', severidad: 'warn' }),
    },
    { campo: 'importeTotal', titulo: 'Total Importe', tipo: 'moneda', moneda: 'S/' },
  ];

  readonly acciones: AccionTabla<Liquidacion>[] = [accionVer()];

  async buscar() {
    const idEmpresa = this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;
    this.cargando.set(true);
    try {
      const datos = await firstValueFrom(this.servicio.listarLiquidacionesPorEmpresa(idEmpresa));
      this.liquidaciones.set(datos);
      // Totales: si hay una regla de negocio, va en core/domain; la tabla solo los pinta.
      this.totales.set({ importeTotal: datos.reduce((s, l) => s + (l.importeTotal ?? 0), 0) });
    } catch {
      this.avisos.error('Error', 'No se pudieron cargar las liquidaciones.');
    } finally {
      this.cargando.set(false);
    }
  }

  alAccion({ accion, fila }: EventoAccionTabla<Liquidacion>) {
    if (accion === 'ver') {
      // Navegar al detalle, abrir un diálogo, etc.
      this.avisos.info('Liquidación', fila.nrodoc);
    }
  }

  async exportar({ formato, filas }: EventoExportarTabla<Liquidacion>) {
    if (formato !== 'excel') return;
    await this.carga.ejecutar(() => this.excel.generarReporteLiquidaciones(filas), 'Generando Excel');
  }
}
```

(Los nombres concretos del enum de estados y del id de empresa dependen de `core`: verifica los
reales al implementar la pantalla).

### Modo servidor (lazy)

```html
<app-tabla
  [filas]="pagina()"
  [columnas]="columnas"
  [lazy]="true"
  [totalRegistros]="total()"
  [cargando]="cargando()"
  (cargar)="cargarPagina($event)"
/>
```

```ts
cargarPagina(e: EventoCargaTabla) {
  // e.primero, e.filas, e.ordenCampo, e.orden (1|-1), e.busqueda, e.filtros
}
```

---

## Ejemplo 2: maestro CRUD (tabla + diálogo + confirmación + toast)

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { SessionService } from '../../core/auth';
import type { Chofer } from '../../core/models';
import { NotificacionService } from '../../core/notifications';
import { ChoferService } from '../../core/services';
import {
  ConfirmacionService,
  DialogoCrud,
  Tabla,
  TablaCelda,
  accionEditar,
  accionEliminar,
  type ColumnaTabla,
  type EventoAccionTabla,
} from '../../shared/ui';

@Component({
  selector: 'app-maestro-choferes',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, Tabla, TablaCelda, DialogoCrud],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla
      [filas]="choferes()"
      [columnas]="columnas"
      [acciones]="acciones"
      [cargando]="cargando()"
      (accion)="alAccion($event)"
    >
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
          <span class="text-sm font-medium">Nombres</span>
          <input pInputText formControlName="nombres" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Apellidos</span>
          <input pInputText formControlName="apellidos" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">DNI</span>
          <input pInputText formControlName="dni" />
        </label>
      </form>
    </app-dialogo-crud>
  `,
})
export class MaestroChoferes {
  private readonly servicio = inject(ChoferService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(NotificacionService);
  private readonly sesion = inject(SessionService);

  readonly choferes = signal<Chofer[]>([]);
  readonly cargando = signal(false);
  readonly dialogoVisible = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Chofer | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    dni: ['', Validators.required],
  });

  readonly columnas: ColumnaTabla<Chofer>[] = [
    { campo: 'id', id: 'item', titulo: 'Item', ordenable: false, buscable: false, ancho: '4rem' },
    { campo: 'nombres', titulo: 'Nombres' },
    { campo: 'apellidos', titulo: 'Apellidos' },
    { campo: 'dni', titulo: 'DNI' },
    { campo: 'licencia', titulo: 'Licencia Conductor' },
    {
      campo: 'vehiculo.placaTracto',
      titulo: 'Vehículo asignado (tracto / bombona)',
      formato: (_v, c) => `${c.vehiculo?.placaTracto ?? ''} / ${c.vehiculo?.placaBombona ?? ''}`,
    },
  ];

  readonly acciones = [accionEditar<Chofer>(), accionEliminar<Chofer>()];

  private get idEmpresa() {
    return this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;
  }

  constructor() {
    void this.listar();
  }

  async listar() {
    this.cargando.set(true);
    try {
      this.choferes.set(await firstValueFrom(this.servicio.listarTodosLosChoferes(this.idEmpresa)));
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(chofer?: Chofer) {
    this.editando.set(chofer ?? null);
    this.form.reset({ nombres: chofer?.nombres ?? '', apellidos: chofer?.apellidos ?? '', dni: chofer?.dni ?? '' });
    this.dialogoVisible.set(true);
  }

  async alAccion({ accion, fila }: EventoAccionTabla<Chofer>) {
    if (accion === 'editar') this.abrir(fila);
    if (accion === 'eliminar') {
      const ok = await this.confirmacion.confirmar({
        mensaje: `¿Confirma eliminar el registro: ${fila.nombres} ${fila.apellidos}?`,
        aceptar: 'Eliminar',
        peligro: true,
      });
      if (ok) this.avisos.info('Opción deshabilitada'); // v1 no elimina choferes
    }
  }

  async guardar() {
    if (this.form.invalid || this.guardando()) return;
    const original = this.editando();
    const chofer: Chofer = { ...original, ...this.form.getRawValue() };
    this.guardando.set(true);
    try {
      await firstValueFrom(original ? this.servicio.actualizarChofer(chofer) : this.servicio.registrarChofer(chofer));
      this.dialogoVisible.set(false);
      this.avisos.exito(original ? 'Registro actualizado correctamente' : 'Registro añadido correctamente');
      await this.listar();
    } catch {
      this.avisos.error('Error', 'No se pudo guardar el chofer.');
    } finally {
      this.guardando.set(false);
    }
  }
}
```

(El JSON enviado al backend debe ser el de v1: revisa en el popup de v1 qué campos arma antes de
llamar al servicio).

---

## Pruebas

Cada componente tiene su `*.spec.ts` al lado. En las pruebas de pantallas:

- `p-dialog` y `p-confirmdialog` se renderizan en el DOM del componente (no hace falta `appendTo`);
  búscalos con `document.querySelector('.p-dialog')`.
- El buscador y los filtros esperan `retardoFiltro` ms: usa `[retardoFiltro]="0"` y un
  `await new Promise((r) => setTimeout(r, 20))` en la prueba.
