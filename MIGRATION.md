# Plan de migración: SYSFAC frontend
De `sysfac-webapp-v1` (Angular 6 + Material + Egret) a `sysfac-webapp-v2` (Angular 21 + PrimeNG 21 + Tailwind), con despliegue en **Cloudflare Pages**

## Contexto
`sysfac-webapp-v1` está en Angular 6 (2018), sobre la plantilla Egret, con dependencias abandonadas o vulnerables. Hoy se despliega en Firebase Hosting desde GitHub Actions (Node 14 y un `FIREBASE_TOKEN` obsoleto).
Actualizarlo en su lugar exigiría 16 saltos de versión mayor de Angular, con migraciones Altas (Ivy y MDC), y parte de ese trabajo se descartaría porque Material y Egret se eliminan igual.

**Decisión:** reconstruir el frontend en `D:\Personal\Proyectos\Facturacion\nueva_version\sysfac-webapp-v2`. Se generó como proyecto Angular 22.2 y se bajó a **Angular 21** (ver 0.2): componentes standalone, `@angular/build`, Vitest, TypeScript 5.9, RxJS 7.8 y `strict` activo.
La lógica de negocio (modelos, servicios y pantallas) se **porta** desde v1, que queda en producción como referencia hasta el cambio final.
El despliegue de v2 se hace en **Cloudflare Pages**: es gratuito, con ancho de banda ilimitado, vista previa por PR y Web Analytics incluido. El despliegue en Cloudflare y la captura de errores de JavaScript con **Sentry** se montan en la Fase 5, antes de la salida a producción. Hasta entonces, cada oleada se valida **en local** (`ng serve` en `http://localhost:4300`) y GitHub Actions solo ejecuta CI (lint, test y build).
**Fuera de alcance:** el desarrollo del backend. Solo se coordinan HTTPS y CORS con quien lo mantenga.

### Criterios de complejidad
- **Baja:** cambio mecánico o de configuración, con poco riesgo; menos de 1 día y sin lógica de negocio.
- **Media:** toca varias piezas y requiere pruebas manuales; de 1 a 3 días, con riesgo moderado.
- **Alta:** lógica de negocio crítica o pantallas grandes (más de 900 líneas en v1); más de 3 días, con riesgo alto.

## Arquitectura por capas
El desarrollo se organiza por capas. Las capas base se construyen **una vez y de forma horizontal**: infraestructura, core y diseño. Las pantallas se construyen después **en cortes verticales**, una funcionalidad completa a la vez, apoyadas en esas bases. El CI (lint, test y build) se monta al inicio y corre en cada push y PR. Durante el desarrollo, cada oleada se revisa en local. El despliegue en Cloudflare Pages (vistas previas y producción) se monta en la Fase 5, antes del cambio a producción.

| Capa | Carpeta en v2 | Contenido | Puede depender de | Fase |
|---|---|---|---|---|
| **Infraestructura** | raíz, `.github/`, `public/`, `src/environments/`, `src/app/app.config.ts` | repo, tooling (ESLint, Vitest, Playwright), environments, CI con GitHub Actions, ejecución local, `_headers` | — | 0 y 1 |
| **Core** | `src/app/core/` (`models/`, `services/`, `auth/`, `interceptors/`, `domain/`) | contratos con el backend, servicios HTTP, autenticación, manejo de errores, exportación Excel/PDF, validadores y **reglas de negocio puras** (`domain/`: cálculo de importes e impuestos) | Infraestructura | 2 |
| **Diseño** | `src/app/shared/ui/`, `src/app/layout/`, tema | tokens, layout y componentes reutilizables sobre PrimeNG; no contiene lógica de negocio | Core (tipos y servicios de exportación Excel/PDF, que usa la tabla genérica de 3.3) | 3 |
| **Funcionalidades** | `src/app/features/<modulo>/` | pantallas de negocio, cada una con su `<modulo>.routes.ts` | Core y Diseño; **nunca** otra feature | 4 |
| **Producción** | `.github/`, `public/` | despliegue en Cloudflare Pages, Web Analytics, coordinación con el backend, validación contra v1, observabilidad de errores (Sentry), cambio de dominio, retiro de v1 y rendimiento | todas | 5 |

Reglas de dependencia, que se verifican en el lint (tarea 2.7):
- `core` no importa nada de `shared/ui`, `layout` ni `features`.
- `shared/ui` no importa nada de `features`.
- Una feature no importa nada de otra feature.

Estas reglas mantienen las capas limpias y ayudan a que los agentes no colisionen, porque cada uno trabaja dentro de una capa o una feature.

## Inventario de v1 (lo que hay que portar)
Menú de negocio: `iconMenu` en `src/app/shared/services/navigation.service.ts`. Rutas: `src/app/views/forms/forms.routing.ts`.

| Módulo | Origen en v1 (`src/app/...`) | Tamaño TS | Notas |
|---|---|---|---|
| Login | `views/sessions/signin` + `empresa.service.ts` | ~370 | selección de empresa |
| Principal | `views/dashboard` | 200 | tarjetas, gráficos, tabla |
| Guías: registro | `views/forms/basic-form` | **981** | formulario grande |
| Guías: consulta | `views/tables/paging-table` | **591** | exportación a Excel/PDF |
| Liquidación: registro | `views/forms/file-upload` + `inline-edit` + `buscar-guia-liq` | **~1.776** | edición en línea, carga de Excel |
| Liquidación: consulta | `views/forms/rich-text-editor` | 374 | |
| Facturación: registro | `views/forms/wizard` + `factura-item`, `factura-item-guias`, `factura-pop-up`, `table-detail` | **~1.880** | stepper, cálculo de impuestos |
| Facturación: consulta / auditoría | `wizard/factura-consulta`, `wizard/factura-auditoria` | 395 / 282 | |
| Configuración (6 maestros) | `views/forms/configuracion/maestro-*` + popups | ~1.800 | CRUD |
| Usuarios | `views/profile` | 279 | |
| Localizar unidades | `views/map` | 62 | Google Maps |
| Servicios / modelos | `shared/services/**`, `shared/models/**`, `shared/helpers/**` | ~3.000 | `excel.service.ts`, `usuario.service.ts` (`localStorage`), `auth.guard.ts` |

No se portan: las demos de Egret (`app-calendar`, `app-chats`, `app-inbox`, `shop`, `material`, `others`, etc.), el layout de Egret, `server.js` ni `firebase.json`.

---

## Fase 0: Capa de infraestructura, base del proyecto v2

| ID | Tarea | Complejidad |
|---|---|---|
| 0.1 | `git init` en v2; crear el repo de GitHub `sysfac-webapp-v2` con ramas `main` (producción) y `develop`; revisar el `.gitignore` (`dist/`, `.angular/`) | Baja |
| 0.2 | Verificar qué versión de PrimeNG soporta la versión de Angular **y su licencia**. PrimeNG 22+ usa la *PrimeUI License*, que exige una clave (sin ella muestra el aviso "Invalid PrimeUI License"); la última versión MIT es **PrimeNG 21.1.10**, así que el proyecto usa **Angular 21** | Baja |
| 0.3 | Instalar `primeng`, `@primeuix/themes`, `primeicons`, `tailwindcss` y `tailwindcss-primeui`. Los paquetes de PrimeUI van con **versión exacta** (sin `^`), en sus últimas versiones MIT: `primeng@21.1.10`, `@primeuix/themes@2.0.3` y `primeicons@7.0.0` (`primeicons@8` tampoco es MIT); configurar `providePrimeNG` (preset Aura) en `src/app/app.config.ts`. Las directivas de Tailwind y el orden de capas CSS van en `src/tailwind.css`, un CSS plano que se carga antes de `src/styles.scss`, porque Tailwind 4 no se procesa bien a través de Sass; `src/styles.scss` queda para los estilos globales | Baja |
| 0.4 | Agregar ESLint (`angular-eslint`); Prettier y Vitest ya vienen en el proyecto | Baja |
| 0.5 | Crear `src/environments` (`development`, `staging`, `production`) con `apiUrl`, para reemplazar `var.constant.ts` de v1; configurar `fileReplacements` en `angular.json` | Baja |
| 0.6 | Escribir el checklist de flujos críticos usando v1 como referencia: login, guías, liquidación, facturación, maestros y exportaciones | Baja |
| 0.7 | Crear pruebas e2e de humo con Playwright, parametrizadas por URL, que se ejecuten primero contra v1 y luego contra v2 | Media |

## Fase 1: Capa de infraestructura, CI y ejecución local
El despliegue en Cloudflare Pages se movió a la Fase 5: las tareas 1.1, 1.2b, 1.4, 1.5 y 1.6 están en esa fase y conservan su ID. Hasta entonces, todo se ejecuta y se valida en local:
- **v2:** `npx ng serve` en `http://localhost:4300` (puerto fijo en `angular.json`). Solo el orquestador ejecuta `ng serve`.
- **v1 (referencia):** su propio `ng serve` en `http://localhost:4200`.
- **Backend:** local, en `http://localhost:8443/v1/sisyfac/api` (los tres `environment.*.ts`). Su CORS debe permitir `http://localhost:4300`.
- **e2e:** `npx playwright test` contra v2 local, o `BASE_URL=http://127.0.0.1:4200 npx playwright test` contra v1.

| ID | Tarea | Complejidad |
|---|---|---|
| 1.2 | Crear el workflow de CI `.github/workflows/ci.yml`. Pasos: `actions/checkout@v4`, Node 22, `npm ci`, `ng lint`, `ng test` y `ng build` (con la configuración `production` en `main` y `staging` en el resto). Disparadores: push a `main`, `develop` y `wave/**`, y PR. No despliega: el despliegue se agrega en 1.2b (Fase 5) | Media |
| 1.3 | Preparar `public/_headers` para Cloudflare Pages: cabeceras de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y una CSP básica que permita la URL del backend; el dominio de Sentry se agrega en 5.5); caché `immutable` para los `*.js` y `*.css` con hash, y `no-cache` para `index.html`. El build no debe generar `404.html`, para que Pages sirva `index.html` en las rutas profundas. Para que la CSP no necesite scripts inline, `inlineCritical` está desactivado en las configuraciones `production` y `staging` de `angular.json`. Fuera de Cloudflare el archivo no tiene efecto; su verificación se hace en 1.2b | Baja |

## Fase 2: Capa core (portar desde v1)

| ID | Tarea | Complejidad |
|---|---|---|
| 2.1 | Portar `shared/models/**` a `src/app/core/models` y ajustar los tipos al modo `strict` | Baja |
| 2.2 | Portar los servicios HTTP (`guias`, `liquidacion`, `facturacion`, `factorias`, `vehiculo`, `chofer`, `productos`, `tarifa-ruta`, `util/tiposGenericos`) a `src/app/core/services`, usando `inject(HttpClient)`, `environment.apiUrl` y tipos estrictos | Media |
| 2.3 | Autenticación: portar `usuario.service.ts`, convertir `auth.guard.ts` en un `CanActivateFn` funcional y crear un interceptor HTTP para el token y el manejo de 401 | Media |
| 2.4 | Exportaciones: rehacer `excel.service.ts` con `exceljs` o SheetJS actual, y la generación de PDF con `jspdf` y `jspdf-autotable` actuales | Media |
| 2.5 | Validadores propios (reemplazan `ng2-validation`) en `src/app/core/validators` | Baja |
| 2.6 | Llevar el menú de negocio (`iconMenu`) a un `MenuItem[]` de PrimeNG y el breadcrumb a los datos de ruta (`data.breadcrumb`) | Baja |
| 2.7 | Reglas de dependencia entre capas en ESLint (`eslint-plugin-boundaries`), según la sección de arquitectura, para que `ng lint` falle si una capa importa lo que no debe. Lo hace el orquestador, porque toca la configuración compartida | Baja |

## Fase 3: Capa de diseño (tema, layout y componentes base)

| ID | Tarea | Complejidad |
|---|---|---|
| 3.1 | Tokens del tema: colores corporativos, tipografía y modo oscuro opcional | Baja |
| 3.2 | Crear el layout de la aplicación (`src/app/layout`): shell, sidebar con `p-panelmenu`, header con el usuario y la empresa, breadcrumb y un `p-toast` global | **Alta** |
| 3.3 | Crear componentes reutilizables en `src/app/shared/ui`: tabla genérica (`p-table` con paginación, filtros y exportación), diálogo CRUD, confirm y loader | **Alta** |
| 3.4 | Layout de autenticación y páginas 404 y de error. La pantalla de login es una funcionalidad y va en 4.1 | Baja |

## Fase 4: Capa de funcionalidades: pantallas de negocio rehechas en PrimeNG, con v1 como referencia funcional
Patrón para cada pantalla (corte vertical): componente standalone en `src/app/features/<modulo>/`, carga diferida por ruta, Reactive Forms tipados, signals para el estado y Tailwind para el layout. La pantalla usa los servicios de `core` y los componentes de `shared/ui`. Si necesita una regla de negocio nueva (por ejemplo un cálculo), esa regla va en `core/domain` con sus pruebas unitarias, no dentro del componente. Luego se pasa el checklist y el e2e, se integra en `wave/ola-<n>` y se revisa en local (`ng serve` en `http://localhost:4300`).

| ID | Pantalla | Complejidad | Motivo |
|---|---|---|---|
| 4.1 | Login + selección de empresa | Baja | Formulario pequeño |
| 4.2 | Usuarios (`profile`) | Baja | Pocas líneas |
| 4.3 | Localizar unidades (con `@angular/google-maps`) | Baja | 62 líneas |
| 4.4 | Maestros de Plantas, Choferes y Vehículos (subcarpetas `factorias/`, `choferes/` y `vehiculos/` de `features/configuracion`) | Baja | CRUD simple apoyado en 3.3 |
| 4.5 | Maestros de Productos, Clientes y Tarifas (subcarpetas `productos/`, `clientes/` y `tarifas/` de `features/configuracion`) | Media | Más campos y validaciones |
| 4.6 | Principal (dashboard): página de inicio con bienvenida (usuario y empresa de la sesión) y accesos directos a los módulos. El dashboard de v1 es la demo de Egret con cifras fijas y no se porta | Baja | Sin backend ni gráficos |
| 4.7 | Consulta de liquidaciones | Media | Filtros y tabla |
| 4.8 | Facturación: consulta y auditoría | Media | Filtros, diálogos y exportación |
| 4.9 | Consulta de guías | Media | Paginación, filtros, Excel y PDF |
| 4.10 | Registro de guías | **Alta** | Formulario grande, catálogos dependientes |
| 4.11 | Registro de liquidación | **Alta** | Edición en línea, carga de Excel, cálculos |
| 4.12 | Registro de factura | **Alta** | Stepper, importes e impuestos, relación con guías; es el flujo más crítico |

## Fase 5: Producción (despliegue, salida y cierre)
Las tareas 1.x de esta fase vienen de la Fase 1 y conservan su ID. Van primero porque 5.5 (source maps desde el workflow) y 5.1 (validación en `staging`) necesitan el despliegue funcionando.

| ID | Tarea | Complejidad |
|---|---|---|
| 1.1 | En Cloudflare: crear el proyecto de Pages `sysfac-webapp-v2` en modo *Direct Upload*, con `main` como rama de producción, y un API token con permiso **Cloudflare Pages: Edit**. En GitHub: crear los secrets `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` | Baja |
| 1.2b | Agregar el despliegue al workflow `ci.yml`: `cloudflare/wrangler-action@v3` con `pages deploy dist/sysfac-webapp-v2/browser --project-name=sysfac-webapp-v2 --branch=${{ github.head_ref \|\| github.ref_name }}` y permiso `deployments: write`. Un push a `main` publica en producción; `develop`, `wave/**` y los PR publican una vista previa en `https://<rama>.sysfac-webapp-v2.pages.dev`. Verificar que las rutas profundas cargan al recargar y que se aplica `_headers` (1.3) | Baja |
| 1.4 | Dominio propio: asociar el dominio al proyecto (DNS en Cloudflare o un CNAME). El HTTPS es automático. Mientras tanto se usa `sysfac-webapp-v2.pages.dev` | Baja |
| 1.5 | Observabilidad básica: activar **Cloudflare Web Analytics** en el proyecto de Pages (visitas, Core Web Vitals) | Baja |
| 1.6 | Coordinación con el backend: hoy es local (`http://localhost:8443`). Antes de desplegar se necesita una URL pública con HTTPS (si no, el navegador bloquea las llamadas por contenido mixto) y un CORS que permita el dominio de producción y `https://*.sysfac-webapp-v2.pages.dev`. Al tenerla, actualizar `environment.ts`, `environment.staging.ts` y el `connect-src` de `public/_headers` | Baja |
| 5.5 | **Sentry**, antes de 5.1 para capturar errores durante la validación: crear la cuenta y el proyecto Angular en sentry.io (lo hace el usuario); instalar `@sentry/angular` y configurar `ErrorHandler` y tracing en `app.config.ts`, con el DSN en `environments`; agregar el dominio de Sentry a la CSP de `public/_headers`; subir los source maps desde el workflow con `getsentry/action-release` (secret `SENTRY_AUTH_TOKEN`), usando el SHA del commit como versión, y no publicar los `.map` en Pages. Lo hace el orquestador, porque toca archivos compartidos | Media |
| 5.1 | Validación en paralelo: usuarios clave trabajan en el entorno `staging` (vista previa de `develop`) con datos reales; para guías, liquidación y factura se compara el JSON enviado al backend y los PDF/Excel generados contra v1 | Media |
| 5.2 | Cambio final: merge a `main`, despliegue de producción en Cloudflare y apuntar el dominio a Pages. v1 sigue en Firebase como respaldo de 2 a 4 semanas | Baja |
| 5.3 | Retirar v1: desactivar el workflow de Firebase (`.github/workflows/main.yml` de v1), archivar el repo de v1 y revocar `FIREBASE_TOKEN` | Baja |
| 5.4 | Rendimiento: `@defer` en las pantallas pesadas, presupuestos de bundle en `angular.json` y `npm audit` sin vulnerabilidades críticas | Baja |

---

## Resumen por complejidad (42 tareas)
- **Baja (26):** 0.1–0.6, 1.1, 1.2b, 1.3, 1.4, 1.5, 1.6, 2.1, 2.5, 2.6, 2.7, 3.1, 3.4, 4.1–4.4, 4.6, 5.2, 5.3, 5.4
- **Media (11):** 0.7, 1.2, 2.2, 2.3, 2.4, 4.5, 4.7–4.9, 5.5, 5.1
- **Alta (5):** 3.2 (layout), 3.3 (`shared/ui`), 4.10 (guías), 4.11 (liquidación), 4.12 (factura)

Orden recomendado: Fase 0 → Fase 1 (CI y ejecución local con una página vacía) → 2 → 3 → 4 (de Baja a Alta) → 5 (primero el despliegue en Cloudflare, luego la salida a producción).

## Orquestación con agentes

### ¿Hacen falta varios agentes?
Bastan **dos definiciones de agente** (DevMid y DevSenior) y el orquestador; no hace falta un agente por tarea.
- **Fases secuenciales:** 0, 1, 3.2 y 3.3. Cada paso depende del anterior, así que más agentes no aceleran nada y solo agregan riesgo de conflicto.
- **Fases paralelizables:** 2 y 4.1–4.9. Aquí sí conviene correr varias instancias, pero como máximo **3 a la vez**. Con más, crecen los conflictos de merge y el costo sin una ganancia real.
- Una instancia es una ejecución de un agente sobre una tarea. Una misma definición (por ejemplo DevMid) puede tener varias instancias a la vez, cada una en su propio worktree.

| Rol | Definición | Modelo | Tareas |
|---|---|---|---|
| **Orquestador** (sesión abierta en v2, ver regla 11) | — | Opus | Fase 0, Fase 1, despliegue (1.1, 1.2b, 1.4–1.6), 5.5, tareas que tocan archivos compartidos, asignación, revisión, merge y reporte al usuario |
| **DevSenior** | `.claude/agents/dev-senior.md` | Sonnet (Opus en 4.10–4.12, indicado por el orquestador al lanzar la tarea) | 3.2, 3.3 (en secuencia, sin paralelo), 4.10, 4.11, 4.12 y revisión de los PR de DevMid antes del merge |
| **DevMid** | `.claude/agents/dev-mid.md` | Sonnet | 2.1–2.6, 3.4, 4.1–4.9 y 5.4 |

### Reglas para que los agentes no colisionen
1. **Aislamiento:** cada instancia corre con `isolation: "worktree"`, con su propio directorio y su rama `feat/<id-tarea>`, por ejemplo `feat/4.4-maestros`. Requisito: v2 debe ser repo git con un commit inicial (tarea 0.1).
2. **Un dueño por carpeta:** cada pantalla vive en `src/app/features/<modulo>/` con su propio `<modulo>.routes.ts`, y solo la tarea asignada edita esa carpeta. Excepción: `features/configuracion` la comparten 4.4 y 4.5, así que el orquestador deja `configuracion.routes.ts` apuntando con `loadChildren` a una subcarpeta por maestro (`<maestro>/<maestro>.routes.ts`); cada tarea edita solo sus subcarpetas y nadie toca `configuracion.routes.ts`.
3. **Archivos compartidos bloqueados:** solo el orquestador o DevSenior pueden editar `package.json`, `package-lock.json`, `angular.json`, `src/app/app.routes.ts`, `src/app/app.config.ts`, `src/styles.scss`, `src/tailwind.css`, `src/app/core/**` y `src/app/shared/ui/**`. Si DevMid necesita un cambio ahí, lo pide en su reporte y no lo hace.
4. **Rutas preregistradas:** antes de la Fase 4, el orquestador deja en `app.routes.ts` todas las rutas lazy (`loadChildren: () => import('./features/<modulo>/<modulo>.routes')`) apuntando a stubs. Así ningún agente necesita tocar ese archivo.
5. **Dependencias instaladas de antemano:** todas las librerías se instalan en la Fase 0 (PrimeNG, Tailwind, exceljs, jspdf, `@angular/google-maps`). La única excepción es `@sentry/angular`, que el orquestador instala en la tarea 5.5. Los agentes tienen prohibido hacer `npm install <paquete>`. En su worktree solo ejecutan `npm ci`.
6. **Sin `ng serve` por parte de los agentes:** validan con `ng lint`, `ng test` y `ng build`, así no compiten por el puerto 4300 ni por la caché `.angular`.
7. **Paralelo solo entre tareas sin dependencias:** la Fase 2 se reparte por servicio. La Fase 4 empieza solo cuando 2.2, 2.3, 3.2 y 3.3 están fusionadas en `develop`. Las pantallas 4.10–4.12 van **una a la vez**.
8. **Merge serializado con confirmación del usuario:** el orquestador fusiona las ramas de cada tarea, de a una, en la rama de integración de la oleada (`wave/ola-<n>`), nunca directo a `develop`. Antes de cada fusión, actualiza la rama sobre `wave/ola-<n>`, ejecuta `lint`, `test` y `build`, y obtiene la revisión de DevSenior. `wave/ola-<n>` entra a `develop` **solo con la confirmación manual del usuario** (ver "Punto de control por oleada").
9. **Sin comunicación entre agentes:** los subagentes no se hablan entre sí ni lanzan otros agentes; todo pasa por el orquestador.
10. **Una sola sesión sobre v2:** solo la sesión orquestadora trabaja en v2; cualquier otra sesión abierta en esa carpeta se cierra o no se usa mientras dure la orquestación.
11. **El orquestador debe correr desde v2:** la sesión de planificación (`planner`) está abierta en v1, y `isolation: "worktree"` crea worktrees del repo de la sesión, es decir, de v1. Además, los agentes de `.claude/agents/` del proyecto se cargan al iniciar la sesión. Por eso la orquestación se hace desde una sesión abierta en `sysfac-webapp-v2`, iniciada **después** de crear los archivos de los agentes y `CLAUDE.md`.

### Contenido de cada definición de agente
- **Frontmatter:** `name`, `description` (cuándo usarlo), `model` (`sonnet` u `opus`) y `tools` (Read, Edit, Write, Glob, Grep, Bash).
- **Instrucciones:** el stack de v2 (standalone, signals, PrimeNG, Tailwind, `strict`); v1 en `../sysfac-webapp-v1` como referencia funcional de solo lectura; las reglas 2, 3, 5 y 6 de la lista anterior; y la **Definición de terminado**: `lint`, `test` y `build` en verde, un commit en su rama, sin dependencias nuevas, y un reporte con los archivos tocados, las decisiones tomadas y lo que queda pendiente.

### Ejecución por oleadas
| Oleada | Tareas | Quién | Paralelo |
|---|---|---|---|
| 1 | Fase 0, Fase 1 (1.2 CI y 1.3 `_headers`), stubs de rutas y 2.7 (reglas de capas) | Orquestador | No |
| 2 | 2.1 → (2.2, 2.3, 2.4) y (2.5, 2.6) | DevMid | Hasta 3 |
| 3 | 3.1, 3.2 → 3.3 | Orquestador / DevSenior | No |
| 4 | 3.4, 4.1, 4.2, 4.3 | DevMid | Hasta 3 |
| 5 | 4.4, 4.5, 4.6 | DevMid | Hasta 3 |
| 6 | 4.7, 4.8, 4.9 | DevMid | Hasta 3 |
| 7 | 4.10 → 4.11 → 4.12 | DevSenior + usuario | No |
| 8 | Fase 5: despliegue (1.1 → 1.2b → 1.4, 1.5 y 1.6) → 5.5 (Sentry) → 5.1 → 5.2 → 5.3, y 5.4 | Orquestador + usuario (5.4: DevMid) | No |

Cada oleada termina con un punto de control y la siguiente **no empieza** hasta que el usuario la confirme.

### Punto de control por oleada (confirmación manual obligatoria)
1. **Integración:** el orquestador crea `wave/ola-<n>` desde `develop` y fusiona ahí las ramas de la oleada, ya revisadas por DevSenior.
2. **Validación automática:** se ejecutan `lint`, `test` y `build` sobre `wave/ola-<n>` y la suite e2e contra v2 local. Luego se sirve la rama con `ng serve` en `http://localhost:4300` para la revisión manual. Al subir `wave/ola-<n>` a GitHub, el CI repite `lint`, `test` y `build`.
3. **Resumen para el usuario**, con:
   - las tareas completadas (ID y descripción);
   - los archivos tocados por cada agente;
   - los resultados de lint, test, build, e2e y CI;
   - cómo revisar la oleada en local (URL y rutas a probar);
   - la lista de qué probar manualmente en esa oleada;
   - los pendientes y las observaciones.
4. **Pausa:** el orquestador se detiene y espera la respuesta del usuario. No lanza agentes ni fusiona nada mientras tanto.
5. **Decisión del usuario:**
   - **Confirma ("OK"):** se fusiona `wave/ola-<n>` en `develop` y comienza la oleada siguiente.
   - **Pide cambios:** el orquestador relanza al agente correspondiente con las observaciones, vuelve a integrar en `wave/ola-<n>` y repite el punto de control.
   - **Rechaza:** `develop` queda intacto y se replanifica la oleada con el usuario.

De la oleada 1 a la 7, el punto de control es local. En la oleada 8, una vez montado el despliegue (1.2b), la revisión se hace sobre la vista previa de Cloudflare (`https://wave-ola-8.sysfac-webapp-v2.pages.dev`), y la confirmación del usuario es además la autorización del cambio de dominio a producción (tarea 5.2).

## Verificación
- Al cerrar cada oleada: confirmación manual del usuario sobre `wave/ola-<n>` servida en local (`http://localhost:4300`) antes de fusionar en `develop`.
- En cada push y PR: el CI de GitHub pasa `lint`, `test` y `build`.
- En local: se pasa el checklist de 0.6 y la suite Playwright de 0.7 contra v2 (`http://localhost:4300`) y, como referencia, contra v1 (`http://127.0.0.1:4200`).
- Después de 1.2b (Fase 5): cada push publica una vista previa en `https://<rama>.sysfac-webapp-v2.pages.dev`; las rutas profundas (por ejemplo `/forms/facturacion/consulta`) cargan al recargar la página; `_headers` se aplica (verificable en DevTools → Network); Web Analytics registra visitas; y la suite Playwright pasa con `BASE_URL` apuntando a la vista previa.
- Después de 5.5: un error de prueba lanzado en la vista previa aparece en Sentry con el stack trace legible y la versión (SHA) correcta.
- Antes del cambio final: los JSON, PDF y Excel de v2 coinciden con los de v1 con los mismos datos de entrada (tarea 5.1).

## Riesgos
- PrimeNG congelado en la 21.1.10, la última versión MIT: no recibirá más versiones gratuitas. Cuando Angular 21 salga de LTS (mediados de 2027), habrá que decidir entre la licencia de PrimeNG 22+ (*community* con clave o comercial) o cambiar de librería de UI. Nunca se actualiza PrimeNG, `@primeuix/themes` ni `primeicons` sin revisar antes su licencia, y nunca se usan versiones `-lts`, que son de pago.
- Que el backend no tenga una URL pública con HTTPS ni CORS configurado: bloquea el despliegue de la Fase 5, así que hay que coordinarlo con tiempo, antes de llegar a esa fase (1.6). Durante el desarrollo, el backend local debe permitir `http://localhost:4300` en su CORS.
- Que algo funcione en local y falle en Cloudflare (rutas profundas, `_headers`, CSP): se detecta recién en 1.2b; por eso 1.2b va al inicio de la oleada 8, antes de 5.5 y 5.1.
- Diferencias de comportamiento al rehacer pantallas: por eso existe 5.1, con validación en paralelo, y v1 se mantiene como respaldo.
- Hay dos sesiones de Claude abiertas sobre v1 y v2: conviene trabajar v2 desde una sola sesión para evitar conflictos.

## Historial de cambios del plan
Cambios aprobados por el usuario (regla 6 de `CLAUDE.md`):
1. Sentry pasa de la tarea 1.5 a la nueva tarea 5.5.
2. Las ramas de integración se llaman `wave/ola-<n>`.
3. Tailwind va en `src/tailwind.css` (0.3); `inlineCritical` queda desactivado (1.3); la capa *Diseño* puede usar los servicios de exportación de Core.
4. El servidor de desarrollo de v2 usa el puerto 4300 (v1 sigue en el 4200).
5. El despliegue en Cloudflare (1.1, la parte de despliegue de 1.2 como 1.2b, 1.4, 1.5 y 1.6) pasa a la Fase 5. Hasta entonces, la validación es local y el workflow solo hace CI (`ci.yml`).
6. Angular baja de 22 a 21 y PrimeNG queda fijo en 21.1.10 (MIT), porque PrimeNG 22+ exige una clave de licencia; `primeicons` queda en 7.0.0 por el mismo motivo.
7. El dashboard (4.6) pasa a ser una página de inicio con bienvenida y accesos directos (complejidad Baja): el de v1 es la demo de Egret, con cifras fijas y sin backend.
8. `features/configuracion` se divide en una subcarpeta por maestro, con su propio archivo de rutas, para que 4.4 y 4.5 no compartan `configuracion.routes.ts` (regla 2 de colisiones).
9. Para reducir el consumo, DevSenior usa Sonnet por defecto (revisiones). El orquestador pide Opus explícitamente solo para las tareas Altas críticas 4.10, 4.11 y 4.12.
