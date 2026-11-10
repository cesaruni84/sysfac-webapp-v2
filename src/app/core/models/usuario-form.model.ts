/**
 * Clase: el constructor arma el JSON de login (txtCodigoUsuario, txtClaveUsuario,
 * txtCodigoEmpresa) igual que v1. Se usan primitivos en lugar de String/Number.
 */
export class UsuarioForm {
  txtCodigoUsuario: string;
  txtClaveUsuario: string;
  txtCodigoEmpresa: number;

  constructor(usuario: string, clave: string, numEmpresa: number) {
    this.txtCodigoUsuario = usuario;
    this.txtClaveUsuario = clave;
    this.txtCodigoEmpresa = numEmpresa;
  }
}
