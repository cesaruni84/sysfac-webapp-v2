import type { AccionTabla } from './tabla.types';

/**
 * Acciones de fila habituales (las de las grillas de v1). Se pueden extender con spread:
 * `{ ...accionEliminar(), visible: (g) => g.estado === 0 }`.
 */
export function accionVer<T>(tooltip = 'Consultar'): AccionTabla<T> {
  return { id: 'ver', icono: 'pi pi-search', tooltip, severidad: 'info' };
}

export function accionEditar<T>(tooltip = 'Editar registro'): AccionTabla<T> {
  return { id: 'editar', icono: 'pi pi-pencil', tooltip, severidad: 'primary' };
}

export function accionEliminar<T>(tooltip = 'Eliminar registro'): AccionTabla<T> {
  return { id: 'eliminar', icono: 'pi pi-trash', tooltip, severidad: 'danger' };
}
