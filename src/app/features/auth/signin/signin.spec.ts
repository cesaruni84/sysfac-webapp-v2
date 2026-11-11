import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/auth';
import { Empresa, Usuario } from '../../../core/models';
import { EmpresaService } from '../../../core/services/empresas/empresa.service';
import { MENSAJE_LOGIN_GENERICO, Signin, URL_TRAS_LOGIN } from './signin';

const empresa = { id: 7, comercial: 'ACME', ruc: '20123456789' } as Empresa;

describe('Signin', () => {
  const login = vi.fn();
  const logout = vi.fn();
  const navigate = vi.fn();

  function crear() {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { login, logout } },
        { provide: EmpresaService, useValue: { listarComboEmpresas: () => of([empresa]) } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const fixture = TestBed.createComponent(Signin);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as {
      form: FormGroup;
      empresas: () => Empresa[];
      cargando: () => boolean;
      error: () => string | null;
      signin: () => void;
    };
    return { fixture, cmp };
  }

  function llenar(cmp: ReturnType<typeof crear>['cmp']) {
    cmp.form.patchValue({
      username: 'u',
      password: 'p',
      empresaSelected: empresa,
    });
  }

  beforeEach(() => {
    login.mockReset();
    logout.mockReset();
    navigate.mockReset();
  });

  it('llama a logout() al iniciar y carga las empresas', () => {
    const { cmp } = crear();
    expect(logout).toHaveBeenCalledOnce();
    expect(cmp.empresas()).toEqual([empresa]);
  });

  it('tiene un h1 con el título', () => {
    const { fixture } = crear();
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1?.textContent).toContain('MÓDULO DE FACTURACIÓN ONLINE');
  });

  it('el botón Ingresar está deshabilitado con el formulario inválido', () => {
    const { fixture } = crear();
    const boton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.textContent).toContain('Ingresar');
    expect(boton.disabled).toBe(true);
  });

  it('conserva los atributos name que usa el e2e', () => {
    const { fixture } = crear();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[name="username"]')).not.toBeNull();
    expect(el.querySelector('[name="password"]')).not.toBeNull();
    expect(el.querySelector('[name="empresaSelected"]')).not.toBeNull();
  });

  it('envía el UsuarioForm y navega a /dashboard tras el éxito', () => {
    login.mockReturnValue(of({} as Usuario));
    const { cmp } = crear();
    llenar(cmp);
    cmp.signin();
    expect(login).toHaveBeenCalledWith({
      txtCodigoUsuario: 'u',
      txtClaveUsuario: 'p',
      txtCodigoEmpresa: 7,
    });
    expect(navigate).toHaveBeenCalledWith([URL_TRAS_LOGIN]);
  });

  it('no envía si el formulario es inválido', () => {
    const { cmp } = crear();
    cmp.signin();
    expect(login).not.toHaveBeenCalled();
  });

  it('mientras carga marca cargando y evita doble envío', () => {
    login.mockReturnValue(new Subject<Usuario>());
    const { cmp } = crear();
    llenar(cmp);
    cmp.signin();
    expect(cmp.cargando()).toBe(true);
    cmp.signin();
    expect(login).toHaveBeenCalledOnce();
  });

  it.each([403, 404, 409])('muestra el errorMessage del error %i', (status) => {
    login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status,
            error: {
              codeMessage: 'MFA2002',
              errorMessage: 'Usuario y/o contraseña incorrectos. Intente nuevamente.',
            },
          }),
      ),
    );
    const { fixture, cmp } = crear();
    llenar(cmp);
    cmp.signin();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Usuario y/o contraseña incorrectos. Intente nuevamente.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('MFA2002');
    expect(cmp.error()).toBe('Usuario y/o contraseña incorrectos. Intente nuevamente.');
    expect(cmp.error()).not.toBe('MFA2002');
    expect(cmp.cargando()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('el combobox expone aria-invalid y aria-describedby cuando está tocado e inválido', () => {
    const { fixture, cmp } = crear();
    cmp.form.controls['empresaSelected'].markAsTouched();
    fixture.detectChanges();
    const combo = (fixture.nativeElement as HTMLElement).querySelector('[role="combobox"]');
    expect(combo?.getAttribute('aria-invalid')).toBe('true');
    expect(combo?.getAttribute('aria-describedby')).toBe('empresaSelected-error');
  });

  it('con cuerpo sin errorMessage muestra el genérico y nunca el código', () => {
    login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { codeMessage: 'MFA2002' } })),
    );
    const { cmp } = crear();
    llenar(cmp);
    cmp.signin();
    expect(cmp.error()).toBe(MENSAJE_LOGIN_GENERICO);
    expect(cmp.error()).not.toContain('MFA2002');
  });

  it('usa un mensaje genérico si el error no trae errorMessage', () => {
    login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const { cmp } = crear();
    llenar(cmp);
    cmp.signin();
    expect(cmp.error()).toBe(MENSAJE_LOGIN_GENERICO);
  });
});
