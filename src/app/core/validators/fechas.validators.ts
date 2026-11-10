import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { esVacio } from './util';

/**
 * Fecha parseable por `new Date(valor)` (`CustomValidators.date` de ng2-validation,
 * que usa `!/Invalid|NaN/.test(new Date(v).toString())`). Acepta `Date`, cadenas
 * ISO y marcas de tiempo. Un valor vacio es valido; combinar con `Validators.required`.
 *
 * Pensado para valores `Date` de `p-datepicker`, no para texto `dd/mm/yyyy`:
 * `new Date('05/12/2020')` se interpreta como 12 de mayo (mm/dd) y `'25/12/2020'`
 * es invalido.
 *
 * Error: `{ date: true }`.
 */
export const fecha: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor: unknown = control.value;
  if (esVacio(valor)) return null;
  const parseada = new Date(valor as string | number | Date);
  return Number.isNaN(parseada.getTime()) ? { date: true } : null;
};
