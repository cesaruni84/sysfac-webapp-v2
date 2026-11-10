/**
 * Equivalente a `isPresent(Validators.required(control))` de ng2-validation:
 * null, undefined, cadena vacia o arreglo vacio se consideran "vacios" y los
 * validadores de formato los dejan pasar (la obligatoriedad se delega a
 * `Validators.required`).
 */
export function esVacio(valor: unknown): boolean {
  return (
    valor === null ||
    valor === undefined ||
    ((typeof valor === 'string' || Array.isArray(valor)) && valor.length === 0)
  );
}
