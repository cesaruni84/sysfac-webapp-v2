import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { esVacio } from './util';

const REGEX_EMAIL =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Correo electronico (`CustomValidators.email` de ng2-validation, misma expresion).
 * Un valor vacio es valido.
 *
 * Error: `{ email: true }`.
 */
export const correo: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (esVacio(control.value)) return null;
  return REGEX_EMAIL.test(String(control.value)) ? null : { email: true };
};
