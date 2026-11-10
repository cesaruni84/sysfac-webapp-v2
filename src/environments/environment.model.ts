/** Forma común de los archivos de entorno (reemplaza `var.constant.ts` de v1). */
export interface Environment {
  /** Nombre del entorno, útil para diagnóstico. */
  readonly name: 'development' | 'staging' | 'production';
  readonly production: boolean;
  /** URL base del API de SYSFAC, sin barra final. Equivale a `HOST` en v1. */
  readonly apiUrl: string;
}
