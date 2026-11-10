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

function aNumero(valor: unknown): number {
  return typeof valor === 'number' ? valor : Number(String(valor).replace(/,/g, ''));
}

/**
 * Valor numerico minimo (inclusive). Vacio es valido.
 *
 * Error: `{ min: { min, actual } }` (misma forma que `Validators.min` de Angular).
 */
export function minimo(min: number): ValidatorFn {
  return (control) => {
    if (esVacio(control.value)) return null;
    const actual = aNumero(control.value);
    return Number.isNaN(actual) || actual < min ? { min: { min, actual: control.value } } : null;
  };
}

/**
 * Valor numerico maximo (inclusive). Vacio es valido.
 *
 * Error: `{ max: { max, actual } }`.
 */
export function maximo(max: number): ValidatorFn {
  return (control) => {
    if (esVacio(control.value)) return null;
    const actual = aNumero(control.value);
    return Number.isNaN(actual) || actual > max ? { max: { max, actual: control.value } } : null;
  };
}

/**
 * Valor numerico dentro de [min, max] (inclusive). Vacio es valido.
 *
 * Error: `{ range: { min, max, actual } }`.
 */
export function rango(min: number, max: number): ValidatorFn {
  return (control) => {
    if (esVacio(control.value)) return null;
    const actual = aNumero(control.value);
    return Number.isNaN(actual) || actual < min || actual > max
      ? { range: { min, max, actual: control.value } }
      : null;
  };
}
