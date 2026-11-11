import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionService } from '../../core/auth';
import type { Usuario } from '../../core/models';
import { UsuariosPage } from './usuarios-page';

const usuario: Usuario = {
  id: 1,
  codigo: 'jperez',
  nombres: 'Juan',
  apellidos: 'Perez',
  email: 'j@x.com',
  telefono: '',
  cargo: 'Admin',
  fechaAlta: '2020-01-01',
  empresa: {
    id: 2,
    razonSocial: 'ACME SAC',
    comercial: 'ACME',
    ruc: '20123456789',
    dni: '',
    dirFiscal: 'Av. 1',
    dirComercial: 'Av. 2',
    email: 'e@x.com',
    telefono1: '1',
    telefono2: '',
  },
};

describe('UsuariosPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('muestra los datos del usuario y la empresa de la sesión', () => {
    TestBed.inject(SessionService).setUserLoggedIn(usuario);
    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.nombreCompleto()).toBe('Juan Perez');
    expect(el.querySelector('[data-testid="datos-usuario"]')?.textContent).toContain('jperez');
    expect(el.querySelector('[data-testid="datos-empresa"]')?.textContent).toContain('20123456789');
    expect(el.querySelector('[data-testid="sin-sesion"]')).toBeNull();
  });

  it('muestra aviso sin sesión', () => {
    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="sin-sesion"]')).not.toBeNull();
    expect(fixture.componentInstance.datosUsuario()).toEqual([]);
  });
});
