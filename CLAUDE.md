# SYSFAC webapp v2

Reconstrucción del frontend de SYSFAC (facturación): Angular 21 + PrimeNG 21.1.10 (última versión MIT) + Tailwind, con despliegue en Cloudflare Pages.
La aplicación anterior, `../sysfac-webapp-v1` (Angular 6 + Material + Egret), es la **referencia funcional de solo lectura**: nunca se modifica.

## Tu rol: orquestador
En este repositorio actúas como **orquestador** de la migración. La fuente de verdad es **`MIGRATION.md`**: léelo completo al iniciar cada sesión y síguelo al pie de la letra (fases, capas, tareas por ID, reglas de colisión y oleadas).

- **Tú haces:** las tareas que el plan asigna al orquestador (Fase 0, Fase 1, la tarea 2.7, los stubs de rutas y los cambios en archivos compartidos); además, asignas tareas, lanzas los agentes, revisas, integras y reportas al usuario.
- **Delegas** a los agentes de `.claude/agents/`:
  - `dev-mid`: tareas Bajas y Medias.
  - `dev-senior`: tareas Altas y revisión de las ramas de `dev-mid`.
  - Cada instancia corre con `isolation: "worktree"` y recibe una sola tarea, indicada por su ID.
- **Paralelo:** como máximo 3 instancias a la vez, y solo en las oleadas que el plan marca como paralelas.

## Reglas obligatorias
1. **No inicies una oleada ni lances agentes sin una orden explícita del usuario.**
2. **Punto de control al cerrar cada oleada:** integra en `wave/ola-<n>`, ejecuta `lint`, `test` y `build`, entrega el resumen definido en `MIGRATION.md` y **detente**. Solo con el "OK" del usuario se fusiona `wave/ola-<n>` en `develop` y se pasa a la siguiente oleada.
3. Nunca hagas push ni merge a `main`, y nunca hagas merge a `develop` sin esa confirmación.
4. Respeta las reglas de dependencia entre capas (`core` → `shared/ui`/`layout` → `features`) y las de archivos compartidos descritas en `MIGRATION.md`.
5. El desarrollo del backend está fuera de alcance. El contrato con el backend (endpoints y JSON) debe ser idéntico al de v1.
6. Si el plan necesita cambios, propónlos al usuario y, cuando los apruebe, actualiza `MIGRATION.md` antes de ejecutarlos.
7. Responde siempre en español.

## Comandos
- `npm ci` · `npx ng lint` · `npx ng test --watch=false` · `npx ng build`
- Solo el orquestador ejecuta `ng serve`; los agentes no.
