import type { MenuItem } from 'primeng/api';

/**
 * Menú de negocio de SYSFAC (origen: `iconMenu` de `navigation.service.ts` de v1,
 * solo entradas no comentadas). Mismas secciones, orden y URLs que v1.
 *
 * Cambios de texto respecto a v1 (solo tildes): "Guias" -> "Guías", "Auditoria" -> "Auditoría".
 * Se omite el separador "MENU DEL SISTEMA" de v1 (el encabezado lo decide el layout 3.2).
 * "Factura Electrónica" apuntaba a `404` en v1 (pantalla inexistente): se conserva
 * deshabilitada y sin `routerLink`.
 *
 * "Usuarios" en v1 era un `dropDown` sin hijos que no navegaba; en v2 enlaza a `/profile`
 * (diferencia intencionada).
 *
 * No pasar `MENU_NEGOCIO` directamente a `p-panelmenu` (muta el modelo con
 * `item.expanded`): usar `crearMenuNegocio()`.
 */
export const MENU_NEGOCIO: readonly Readonly<MenuItem>[] = [
  { id: 'principal', label: 'Principal', icon: 'pi pi-th-large', routerLink: '/dashboard' },
  {
    id: 'guias',
    label: 'Guías de Remisión',
    icon: 'pi pi-file',
    items: [
      { id: 'guias-registro', label: 'Registro', routerLink: '/forms/basic' },
      { id: 'guias-consulta', label: 'Consulta', routerLink: '/forms/paging' },
    ],
  },
  {
    id: 'liquidacion',
    label: 'Liquidación',
    icon: 'pi pi-dollar',
    items: [
      { id: 'liquidacion-registro', label: 'Registro', routerLink: '/forms/liquidacion' },
      { id: 'liquidacion-consulta', label: 'Consulta', routerLink: '/forms/busquedaLiquidaciones' },
    ],
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    icon: 'pi pi-credit-card',
    items: [
      { id: 'facturacion-registro', label: 'Registro', routerLink: '/forms/facturacion/registro' },
      { id: 'facturacion-consulta', label: 'Consulta', routerLink: '/forms/facturacion/consulta' },
      {
        id: 'facturacion-auditoria',
        label: 'Auditoría',
        routerLink: '/forms/facturacion/auditoria',
      },
      // v1: state '404' (no existe la pantalla). Sin enlace hasta que haya pantalla.
      { id: 'facturacion-electronica', label: 'Factura Electrónica', disabled: true },
    ],
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: 'pi pi-cog',
    items: [
      { id: 'config-plantas', label: 'Plantas', routerLink: '/forms/configuracion/factorias' },
      { id: 'config-tarifas', label: 'Tarifas', routerLink: '/forms/configuracion/tarifas' },
      { id: 'config-choferes', label: 'Choferes', routerLink: '/forms/configuracion/choferes' },
      { id: 'config-vehiculos', label: 'Vehículos', routerLink: '/forms/configuracion/vehiculos' },
      { id: 'config-productos', label: 'Productos', routerLink: '/forms/configuracion/productos' },
      { id: 'config-clientes', label: 'Clientes', routerLink: '/forms/configuracion/clientes' },
    ],
  },
  { id: 'usuarios', label: 'Usuarios', icon: 'pi pi-user', routerLink: '/profile' },
  { id: 'mapa', label: 'Localizar unidades', icon: 'pi pi-map-marker', routerLink: '/map' },
];

/** Devuelve una copia nueva e independiente del menú en cada llamada (apta para `p-panelmenu`). */
export function crearMenuNegocio(): MenuItem[] {
  return structuredClone(MENU_NEGOCIO) as MenuItem[];
}
