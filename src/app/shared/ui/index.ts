/**
 * Componentes reutilizables de SYSFAC v2 (tarea 3.3). API y ejemplos en `README.md`.
 *
 * Solo deben importarse desde pantallas con carga diferida (features) o desde el shell
 * (también diferido): así no entran al bundle inicial.
 */

// Tabla genérica
export * from './tabla/acciones';
export * from './tabla/tabla';
export { TablaCelda, TablaDetalle } from './tabla/tabla.directivas';
export * from './tabla/tabla.types';

// Diálogo CRUD
export * from './dialogo-crud/dialogo-crud';

// Confirmación
export * from './confirmacion/confirmacion-host';
export * from './confirmacion/confirmacion.service';

// Indicadores de carga (el estado del global, `CargaGlobalService`, vive en core/carga)
export * from './loader/cargando';
export * from './loader/cargando-global';

// Página temporal de las rutas stub
export * from './placeholder-page/placeholder-page';
