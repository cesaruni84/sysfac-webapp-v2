# Checklist de flujos críticos (tarea 0.6)

Checklist manual para validar cada pantalla de v2 contra v1 (`../sysfac-webapp-v1`), que es la referencia funcional.
Se usa en tres momentos:

- al cerrar cada oleada de la Fase 4, sobre la vista previa de `wave/ola-<n>`, solo con los flujos de esa oleada;
- en la validación en paralelo (tarea 5.1), con los flujos completos y datos reales;
- antes del cambio a producción (tarea 5.2).

## Cómo usarlo

1. Ejecutar el mismo flujo **con los mismos datos** en v1 y en v2, con la misma empresa y el mismo usuario.
2. Marcar cada casilla en la columna de cada versión: `✔` (correcto), `✘` (falla) o `—` (no aplica).
3. Donde dice **Comparar JSON**: abrir DevTools → Network en las dos versiones y comparar el cuerpo de la petición y de la respuesta. El contrato con el backend debe ser **idéntico**: mismos endpoints, mismo método HTTP y mismos campos y tipos.
4. Donde dice **Comparar archivo**: guardar el Excel o el PDF de las dos versiones y comparar columnas, orden, formatos (fechas `dd/mm/yyyy`, importes `S/ #,##0.00`) y totales.
5. Anotar en "Observaciones" cualquier diferencia, aunque parezca menor.

Datos de la ejecución:

| Campo | Valor |
|---|---|
| Fecha | |
| Responsable | |
| URL de v1 | |
| URL de v2 (vista previa) | |
| Empresa / usuario de prueba | |

---

## 1. Login y sesión (`/sessions/signin`, feature `auth`, pantalla 4.1)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 1.1 | Abrir `/` | Redirige a `/sessions/signin` | | |
| 1.2 | Abrir el combo de empresas | Lista las empresas que devuelve el backend (`listarComboEmpresas`) | | |
| 1.3 | Enviar el formulario vacío | No se envía; se marcan los campos obligatorios | | |
| 1.4 | Ingresar una clave incorrecta | Mensaje de error; permanece en el login | | |
| 1.5 | Ingresar usuario, clave y empresa válidos | Entra a `/dashboard`; el header muestra el usuario y la empresa | | |
| 1.6 | **Comparar JSON** de la petición de login | Igual en v1 y v2 | | |
| 1.7 | Revisar `localStorage` | La clave `currentUser` tiene la misma estructura que en v1 | | |
| 1.8 | Recargar la página dentro de la app | La sesión se mantiene | | |
| 1.9 | Abrir una ruta privada sin sesión (ventana privada) | Redirige al login y, después de entrar, vuelve a la ruta pedida (`returnUrl`) | | |
| 1.10 | Cerrar sesión | Vuelve al login; se borra `currentUser` | | |

## 2. Principal (`/dashboard`, pantalla 4.6)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 2.1 | Entrar a `/dashboard` | Bienvenida con el usuario, la empresa (con RUC, como en el header) y la fecha de hoy | n/a | |
| 2.2 | Revisar los accesos directos | Las mismas opciones que el menú lateral, según el cargo (un Registrador no ve Facturación) | n/a | |

En v1 esta pantalla era la demo de Egret, con cifras fijas, y no se porta (historial 7 de `MIGRATION.md`). No se compara con v1.

## 3. Guías de remisión

### 3a. Registro (`/forms/basic`, pantalla 4.10)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 3.1 | Abrir el formulario | Se cargan los combos: plantas (remitente y destinatario), choferes, productos, unidades de medida y balanzas | | |
| 3.2 | Elegir planta remitente o destinataria y chofer | Los campos dependientes se completan igual que en v1 | | |
| 3.3 | Escribir números de serie o secuencia cortos | Se completan con ceros a la izquierda; solo se aceptan dígitos | | |
| 3.4 | Registrar una guía nueva válida | Se guarda; mensaje de éxito | | |
| 3.5 | **Comparar JSON** de `registrarGuiaRemisionBD` | Igual en v1 y v2 | | |
| 3.6 | Intentar registrar una serie y secuencia que ya existen | Se avisa que la guía ya existe y no se duplica | | |
| 3.7 | Consultar una guía por número propio y por número de guía del cliente | Carga los datos correctos | | |
| 3.8 | Modificar la guía y guardar | Se actualiza; **comparar JSON** de `actualizarGuiaRemisionBD` | | |
| 3.9 | Anular la guía | Pide confirmación; queda anulada; **comparar JSON** | | |
| 3.10 | Cambiar la fecha de emisión | Se aplican las mismas validaciones y efectos que en v1 | | |
| 3.11 | "Nueva guía" o "Regresar" | Limpia el formulario o vuelve a la consulta | | |

### 3b. Consulta (`/forms/paging`, pantalla 4.9)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 3.12 | Búsqueda inicial | Mismo listado y la misma paginación que en v1 | | |
| 3.13 | Filtrar por fechas, planta destino, chofer, estado y número | Mismos resultados | | |
| 3.14 | Buscar por número de guía del cliente | Mismos resultados | | |
| 3.15 | Revisar la columna de estado de facturación | Mismas glosas | | |
| 3.16 | Abrir una guía desde la grilla | Abre el registro con la guía cargada | | |
| 3.17 | Eliminar una guía | Pide confirmación; desaparece de la grilla; **comparar JSON** | | |
| 3.18 | **Exportar a Excel** (reporte de guías) | **Comparar archivo**: mismas columnas, formatos y filas | | |

## 4. Liquidación

### 4a. Registro (`/forms/liquidacion`, pantalla 4.11)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 4.1 | Abrir el formulario | Se cargan los combos de plantas y motivos de traslado | | |
| 4.2 | Buscar guías por liquidar | Mismo listado (`listarGuiasRemisionPorLiquidar`) | | |
| 4.3 | Seleccionar y agregar guías | Se agrupan igual que en v1; los subtotales por grupo coinciden | | |
| 4.4 | Editar en línea la tarifa de una guía | Se recalculan el subtotal, el IGV y el total; **comparar JSON** de `actualizarTarifaGuiaRemision` | | |
| 4.5 | Quitar una guía | Se recalculan los totales | | |
| 4.6 | Verificar los totales | Cantidad, subtotal, IGV (según `obtenerValorImpuesto`) y total **idénticos** a v1, con el mismo redondeo | | |
| 4.7 | Grabar la liquidación | Se guarda; **comparar JSON** de `registrarLiquidacionBD` | | |
| 4.8 | Recuperar una liquidación por número | Carga cabecera, guías y totales | | |
| 4.9 | Modificar y actualizar | **Comparar JSON** de `actualizarLiquidacionBD` | | |
| 4.10 | Cancelar la liquidación | Pide confirmación; cambia de estado igual que en v1 | | |
| 4.11 | **Imprimir la liquidación (PDF)** | **Comparar archivo**: contenido, totales y paginación | | |
| 4.12 | Intentar grabar con datos o guías inválidos | Mismas validaciones y mensajes que en v1 | | |

### 4b. Consulta (`/forms/busquedaLiquidaciones`, pantalla 4.7)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 4.13 | Listado inicial y filtros (planta, número, fechas, estado) | Mismos resultados | | |
| 4.14 | Asignar una orden de servicio | Se guarda; **comparar JSON** | | |
| 4.15 | Abrir una liquidación desde la grilla | Abre el registro con la liquidación cargada | | |
| 4.16 | Eliminar una liquidación | Pide confirmación; **comparar JSON** | | |
| 4.17 | **Exportar a Excel** (reporte de liquidaciones) | **Comparar archivo**, incluida la columna "Total Importe" en `S/` | | |

## 5. Facturación

### 5a. Registro (`/forms/facturacion/registro`, pantalla 4.12, el flujo más crítico)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 5.1 | Abrir el asistente | Se cargan los clientes de la empresa y los combos | | |
| 5.2 | Elegir tipo de documento, serie y moneda | El símbolo de moneda y la numeración se comportan igual que en v1 | | |
| 5.3 | Validar un documento que ya existe (serie y secuencia) | Lo detecta igual que v1 (`obtenerDocumentPorSerie`) | | |
| 5.4 | Agregar un ítem manual | Se calcula igual que en v1 | | |
| 5.5 | Agregar ítems desde guías de remisión | Mismo listado (`buscarGuiaRemisionItem`) y mismos importes | | |
| 5.6 | Agregar ítems desde una liquidación | Mismo listado (`buscarLiquidacionItem`) y mismos importes | | |
| 5.7 | Editar y eliminar ítems | Se recalculan los totales | | |
| 5.8 | Verificar los totales | Subtotal, IGV, total y glosa **idénticos** a v1, con el mismo redondeo | | |
| 5.9 | Registrar el documento | **Comparar JSON** de `registrar` y `registrarDocumentoElectronico` | | |
| 5.10 | Actualizar el documento | **Comparar JSON** de `actualizar` y `actualizarDocumentoElectronico` | | |
| 5.11 | Anular el documento | Pide confirmación; **comparar JSON** de `anularDocumentoElectronico` | | |
| 5.12 | Comprobar la relación con guías y liquidación | Después de facturar, las guías o la liquidación cambian de estado igual que en v1 | | |
| 5.13 | "Nuevo documento" | Limpia el asistente | | |

### 5b. Consulta (`/forms/facturacion/consulta`, pantalla 4.8)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 5.14 | Buscar con filtros (cliente, tipo, número, fechas, estado) | Mismos resultados (`listarDocumentosPorFiltro`) | | |
| 5.15 | Revisar las columnas de estado, tipo de documento y glosa | Mismos literales | | |
| 5.16 | Cambiar el estado en la grilla | **Comparar JSON** de `actualizarRegistroGrilla` | | |
| 5.17 | Cancelar un documento | Pide confirmación; **comparar JSON** | | |
| 5.18 | Abrir un documento | Abre el registro con el documento cargado | | |
| 5.19 | **Exportar a Excel** (reporte de facturación) | **Comparar archivo**: fechas de emisión y vencimiento e importes | | |

### 5c. Auditoría (`/forms/facturacion/auditoria`, pantalla 4.8)

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 5.20 | Buscar documentos con errores | Mismo listado (`listarDocumentosConErrores`) | | |
| 5.21 | Abrir un documento desde la grilla | Muestra el mismo detalle | | |

## 6. Maestros de configuración (`/forms/configuracion/*`, pantallas 4.4 y 4.5)

Repetir para cada maestro: **Plantas** (`factorias`), **Tarifas**, **Choferes**, **Vehículos**, **Productos** y **Clientes**.

| # | Paso | Resultado esperado | Plantas | Tarifas | Choferes | Vehículos | Productos | Clientes |
|---|---|---|---|---|---|---|---|---|
| 6.1 | Listar | Mismos registros que en v1 | | | | | | |
| 6.2 | Filtrar o buscar en la tabla | Mismos resultados | | | | | | |
| 6.3 | Crear un registro (**comparar JSON**) | Se agrega a la lista | | | | | | |
| 6.4 | Editar un registro (**comparar JSON**) | Se actualiza | | | | | | |
| 6.5 | Eliminar o desactivar (**comparar JSON**) | Pide confirmación; se aplica | | | | | | |
| 6.6 | Validaciones (obligatorios, formatos, duplicados) | Mismos mensajes y reglas que en v1 | | | | | | |

## 7. Usuarios y localización

| # | Paso | Resultado esperado | v1 | v2 |
|---|---|---|---|---|
| 7.1 | `/profile`: ver los datos del usuario | Datos del usuario y de la empresa de la sesión, solo lectura (en v1 era la demo de Egret) | n/a | |
| 7.2 | `/profile/overview` y `/profile/settings` | Redirigen a `/profile` | | |
| 7.3 | `/map`: abrir Localizar unidades | El mapa de Google carga sin errores de CSP en la consola | | |

## 8. Transversales (todas las pantallas)

| # | Paso | Resultado esperado | v2 |
|---|---|---|---|
| 8.1 | Recargar (F5) en una ruta profunda, por ejemplo `/forms/facturacion/consulta` | Carga la misma pantalla, sin un 404 de Cloudflare | |
| 8.2 | Menú lateral | Mismas opciones y el mismo orden que el menú de v1 | |
| 8.3 | Breadcrumb | Refleja la pantalla actual | |
| 8.4 | Error del backend (por ejemplo, con el backend apagado) | Aparece un toast con el error y la app no se rompe | |
| 8.5 | Sesión expirada (401) | Redirige al login | |
| 8.6 | Vista en el celular (ancho de unos 375 px) | El layout se adapta y las tablas se pueden desplazar | |
| 8.7 | DevTools → Console | Sin errores ni avisos de CSP | |
| 8.8 | DevTools → Network → `index.html` | Llegan las cabeceras de `_headers` (CSP, `X-Frame-Options`, `Cache-Control: no-cache`) | |
| 8.9 | Cloudflare Web Analytics | Registra la visita | |

## Diferencias intencionadas con v1

Son cambios aprobados durante la migración. Si v1 y v2 difieren en estos puntos, **no** es una regresión: marcar `—` y no anotarlo como falla.

| Flujo / # | v1 | v2 | Origen |
|---|---|---|---|
| 3.17 Eliminar guía | La guía eliminada seguía apareciendo en la grilla hasta recargar (cache sin invalidar) | Desaparece de inmediato | 2.2 (sin `ngx-cacheable`) |
| 1.9 Ruta privada sin sesión | Redirige al login | Igual; además, un 401 del backend limpia la sesión y redirige al login (sin `returnUrl`) | 2.3 |
| 1.8 Sesión entre pestañas | Cada pantalla lee `localStorage` | El header refleja el login o logout hecho en otra pestaña | 2.3 |
| 5.x Diálogo "Liquidaciones por facturar" (4.12) | Si se escribe un nro. de liquidación y luego se borra, busca `nroDocLiq=000000000000` | Busca con `nroDocLiq=` vacío (todas) | 2.5 |
| RUC del cliente y nro. de documento de la factura | Permitía escribir `.` | Solo acepta dígitos | 2.5 |
| Exportar con datos incompletos (tipo o estado desconocido, fecha inválida) | La exportación fallaba por completo | Genera el archivo con `?` o la celda vacía | 2.4 |
| 8.2 Menú "Usuarios" | Ítem sin enlace (no navegaba) | Enlaza a `/profile` | 2.6 |
| 8.2 Menú "Factura Electrónica" | Enlazaba a una página 404 | Aparece deshabilitado | 2.6 |
| 8.3 Breadcrumb | Toda pantalla de `/forms` mostraba "Guia de Remisión" enlazando a `/forms`; Auditoría decía "FACTURA CON ERRORES" | "Sección > Hoja" con los textos del menú; la sección no es un enlace | 2.6 |
| 1.x Login | Enlaces "¿Olvidó clave?" y "Crear cuenta" (pantallas de demo de Egret); imagen de fondo y logo | Sin esos enlaces; fondo liso con la marca "SYSFAC" | 3.4, 4.1 |
| 2.x Principal | Demo de Egret con cifras y gráficos fijos | Bienvenida y accesos directos según el cargo | 4.6 (historial 7) |
| 7.1 Usuarios | Demo de Egret ("Jhone Doe", gráficos inventados) | Datos de la sesión, solo lectura | 4.2 |
| 8.x URL desconocida | `/sessions/404` | Igual, dentro del layout de autenticación | 3.4 |
| 6.4 Editar cliente DNI u OTRO | Enviaba siempre `tipoDoc: 1` (bug: convertía el cliente en RUC) | Envía el tipo real del cliente. **Aprobado por el usuario** | 4.5 |
| 6.3 Crear tarifa sin moneda | `"moneda": ""` | `"moneda": null` (en la base queda `NULL` igual). **Aprobado por el usuario** | 4.5 |
| 6.6 Validaciones de maestros | "* REQUERIDO" bajo cada campo; DNI y teléfono filtraban teclas | Mismos textos; además, DNI, teléfono y documento del cliente limpian lo pegado | 4.4, 4.5 |
| 6.5 Confirmar baja de chofer o vehículo | El mensaje mostraba "undefined" | Muestra el nombre o las placas | 4.4 |
| 6.x Combos de maestros | Si fallaba la carga, no avisaba | Muestra un aviso de error | 4.4 |
| 6.5 Baja de tarifa | Recargaba al cerrarse el aviso (5 s); el loader quedaba abierto si fallaba | Recarga de inmediato; muestra un aviso si falla | 4.5 |

## Observaciones

| Flujo / # | Diferencia encontrada | Severidad | Acción |
|---|---|---|---|
| | | | |
