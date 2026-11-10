import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { esVacio } from './util';

/**
 * Fecha parseable por `new Date(valor)` (`CustomValidators.date` de ng2-validation,
 * que usa `!/Invalid|NaN/.test(new Date(v).toString())`). Acepta `Date`, cadenas
 * ISO y marcas de tiempo. Un valor vacio es valido; combinar con `Validators.required`.
 *
 * Error: `{ date: true }`.
 */
export const fecha: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor: unknown = control.value;
  if (esVacio(valor)) return null;
  const parseada = new Date(valor as string | number | Date);
  return Number.isNaN(parseada.getTime()) ? { date: true } : null;
};
