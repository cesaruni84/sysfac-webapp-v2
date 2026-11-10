/**
 * Tipos públicos de la tabla genérica (`<app-tabla>`).
 */

type Hoja = string | number | boolean | bigint | symbol | null | undefined | Date;
type Profundidad = [never, 0, 1, 2];

/**
 * Ruta de un campo de `T`: una clave (`'nombres'`) o una ruta con punto hasta 3 niveles
 * (`'empresa.razonSocial'`, `'vehiculo.empresa.ruc'`). No entra en arreglos ni en `Date`.
 */
export type RutaCampo<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends Hoja | readonly unknown[]
    ? never
    : {
        [K in keyof T & string]-?:
          | K
          | (NonNullable<T[K]> extends Hoja | readonly unknown[]
              ? never
              : `${K}.${RutaCampo<NonNullable<T[K]>, Profundidad[D]>}`);
      }[keyof T & string];

/** Cómo se pinta la celda. */
export type TipoColumna = 'texto' | 'numero' | 'moneda' | 'fecha' | 'tag' | 'plantilla';

export type AlineacionColumna = 'izquierda' | 'centro' | 'derecha';

/** Severidades de `p-tag` (PrimeNG). */
export type SeveridadTag = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/** Severidades de `p-button` (PrimeNG). */
export type SeveridadBoton =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast';

/** Texto y color de una celda `tag`. */
export interface ValorTag {
  texto: string;
  severidad?: SeveridadTag;
}

/** Definición de una columna. */
export interface ColumnaTabla<T> {
  /** Campo de la fila (admite ruta con punto). Se usa para mostrar, ordenar, buscar y filtrar. */
  campo: RutaCampo<T>;
  titulo: string;
  /** Por defecto `'texto'`. */
  tipo?: TipoColumna;
  /**
   * Identificador de la columna, para asociar la plantilla (`appTablaCelda`) y los totales.
   * Por defecto `campo`. Úsalo si dos columnas comparten el mismo `campo`.
   */
  id?: string;
  /** Ancho CSS (`'8rem'`, `'120px'`). */
  ancho?: string;
  /** Por defecto `true`. */
  ordenable?: boolean;
  /** Muestra un input de filtro bajo la cabecera ("contiene"). Por defecto `false`. */
  filtrable?: boolean;
  /** Participa del buscador global. Por defecto `true`. */
  buscable?: boolean;
  /** Por defecto: `derecha` en `numero`/`moneda`, `centro` en `tag`, `izquierda` en el resto. */
  alineacion?: AlineacionColumna;
  /** Formato propio (tiene prioridad sobre `tipo`, salvo en `tag` y `plantilla`). */
  formato?: (valor: unknown, fila: T) => string;
  /** `numero`/`moneda`: digitsInfo de Angular. Por defecto `'1.0-2'` y `'1.2-2'` (como v1). */
  digitos?: string;
  /** `moneda`: símbolo antepuesto (`'S/'`, `'$'`), fijo o por fila. Por defecto sin símbolo (como v1). */
  moneda?: string | ((fila: T) => string);
  /** `fecha`: patrón de `formatDate`. Por defecto `'dd/MM/yyyy'` (como v1). */
  formatoFecha?: string;
  /** `tag`: texto y severidad según el valor. Sin esta función se muestra el valor tal cual. */
  tag?: (valor: unknown, fila: T) => ValorTag | null;
}

/** Acción por fila (botón con ícono en la columna "Acciones"). */
export interface AccionTabla<T> {
  /** Identificador que llega en `(accion)`: `'editar'`, `'eliminar'`, `'ver'`, ... */
  id: string;
  /** Clase de PrimeIcons, p. ej. `'pi pi-pencil'`. */
  icono: string;
  /** Tooltip y `aria-label` del botón. */
  tooltip: string;
  severidad?: SeveridadBoton;
  /** Si devuelve `false`, el botón no se pinta en esa fila. */
  visible?: (fila: T) => boolean;
  /** Si devuelve `true`, el botón se pinta deshabilitado. */
  deshabilitada?: (fila: T) => boolean;
}

/** Payload de `(accion)`. */
export interface EventoAccionTabla<T> {
  accion: string;
  fila: T;
}

export type FormatoExportacion = 'excel' | 'pdf';

/** Payload de `(exportar)`: filas visibles tras filtros y orden (todas las páginas). */
export interface EventoExportarTabla<T> {
  formato: FormatoExportacion;
  filas: T[];
}

/** Payload de `(cargar)` en modo `lazy` (paginación, orden y filtros en el servidor). */
export interface EventoCargaTabla {
  /** Índice de la primera fila de la página (0, 10, 20, ...). */
  primero: number;
  /** Filas por página. */
  filas: number;
  ordenCampo?: string;
  /** 1 ascendente, -1 descendente. */
  orden?: 1 | -1;
  /** Texto del buscador global (`''` si está vacío). */
  busqueda: string;
  /** Filtros por columna con valor: `{ campo: texto }`. */
  filtros: Record<string, string>;
}

/** Totales del pie: clave = `id` (o `campo`) de la columna. Los calcula la pantalla. */
export type TotalesTabla = Readonly<Record<string, string | number | null | undefined>>;

/** Contexto de `<ng-template appTablaCelda>`. */
export interface ContextoCeldaTabla<T> {
  $implicit: T;
  /** Valor de `campo` en la fila. */
  valor: unknown;
  /** Índice absoluto de la fila (0-based, considerando la paginación). */
  indice: number;
}

/** Contexto de `<ng-template appTablaDetalle>`. */
export interface ContextoDetalleTabla<T> {
  $implicit: T;
  indice: number;
}
