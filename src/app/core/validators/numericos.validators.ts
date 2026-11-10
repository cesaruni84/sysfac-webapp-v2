import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { esVacio } from './util';

const REGEX_DIGITOS = /^\d+$/;
const REGEX_NUMERO = /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;

/**
 * Solo digitos 0-9 (`CustomValidators.digits` de ng2-validation).
 * Un valor vacio (null, undefined, '') es valido; combinar con `Validators.required`.
 * Un espacio en blanco NO es valido (igual que v1).
 *
 * Error: `{ digits: true }`.
 */
export const digitos: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (esVacio(control.value)) return null;
  return REGEX_DIGITOS.test(String(control.value)) ? null : { digits: true };
};

/**
 * Numero entero o decimal, con signo opcional y comas como separador de miles
 * (`CustomValidators.number` de ng2-validation). Ej.: `12`, `-3.5`, `1,234.50`, `.5`.
 * Un valor vacio es valido.
 *
 * Error: `{ number: true }`.
 */
export const numero: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (esVacio(control.value)) return null;
  return REGEX_NUMERO.test(String(control.value)) ? null : { number: true };
};
