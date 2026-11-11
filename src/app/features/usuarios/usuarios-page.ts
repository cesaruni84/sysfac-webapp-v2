import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { SessionService } from '../../core/auth';

interface Campo {
  etiqueta: string;
  valor: string;
}

/** Perfil de solo lectura del usuario logueado y su empresa (datos de la sesión). */
@Component({
  selector: 'app-usuarios-page',
  imports: [CardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios-page.html',
})
export class UsuariosPage {
  private readonly session = inject(SessionService);

  readonly usuario = this.session.usuarioActual;

  readonly nombreCompleto = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombres} ${u.apellidos}`.trim() : '';
  });

  readonly datosUsuario = computed<Campo[]>(() => {
    const u = this.usuario();
    if (!u) return [];
    return [
      { etiqueta: 'Código', valor: u.codigo },
      { etiqueta: 'Cargo', valor: u.cargo },
      { etiqueta: 'Correo', valor: u.email },
      { etiqueta: 'Teléfono', valor: u.telefono },
      { etiqueta: 'Fecha de alta', valor: u.fechaAlta },
    ];
  });

  readonly datosEmpresa = computed<Campo[]>(() => {
    const e = this.usuario()?.empresa;
    if (!e) return [];
    return [
      { etiqueta: 'Razón social', valor: e.razonSocial },
      { etiqueta: 'Nombre comercial', valor: e.comercial },
      { etiqueta: 'RUC', valor: e.ruc },
      { etiqueta: 'Dirección fiscal', valor: e.dirFiscal },
      { etiqueta: 'Dirección comercial', valor: e.dirComercial },
      { etiqueta: 'Correo', valor: e.email },
      { etiqueta: 'Teléfono 1', valor: e.telefono1 },
      { etiqueta: 'Teléfono 2', valor: e.telefono2 },
    ];
  });
}
