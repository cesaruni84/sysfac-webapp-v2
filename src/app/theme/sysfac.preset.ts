import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Paleta corporativa de SYSFAC (tarea 3.1).
 *
 * Es la paleta del tema activo de v1, `egret-blue` (`src/assets/styles/scss/themes/_egret-blue.scss`,
 * `$mat-primary`, base `#247ba0`). v1 no tenía tono 950; se deriva oscureciendo el 900.
 */
export const SYSFAC_PRIMARY = {
  50: '#e5eff4',
  100: '#bdd7e3',
  200: '#92bdd0',
  300: '#66a3bd',
  400: '#458fae',
  500: '#247ba0',
  600: '#207398',
  700: '#1b688e',
  800: '#165e84',
  900: '#0d4b73',
  950: '#083a5c',
} as const;

/**
 * Preset de PrimeNG para SYSFAC: Aura con el `primary` corporativo.
 *
 * - Tailwind usa los mismos tokens gracias a `tailwindcss-primeui` (`bg-primary`, `text-primary`,
 *   `bg-primary-100`, etc.), así que no se definen colores duplicados en Tailwind.
 * - Modo oscuro opcional: se activa agregando la clase `app-dark` al elemento `<html>`
 *   (ver `darkModeSelector` en `app.config.ts`). El interruptor lo pone el layout (3.2).
 */
export const SysfacPreset = definePreset(Aura, {
  semantic: {
    primary: SYSFAC_PRIMARY,
  },
});
