import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { UsuarioForm } from '../models';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { usuarioMock } from './auth.testing';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('login hace POST a /login con el UsuarioForm y guarda la sesión', () => {
    const http = TestBed.inject(HttpTestingController);
    let res: unknown;
    TestBed.inject(AuthService)
      .login(new UsuarioForm('admin', '123', 2))
      .subscribe((u) => (res = u));
    const req = http.expectOne(`${environment.apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      txtCodigoUsuario: 'admin',
      txtClaveUsuario: '123',
      txtCodigoEmpresa: 2,
    });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(usuarioMock);
    expect(res).toEqual(usuarioMock);
    expect(TestBed.inject(SessionService).isAuthenticated()).toBe(true);
  });

  it('logout limpia la sesión', () => {
    const s = TestBed.inject(SessionService);
    s.setUserLoggedIn(usuarioMock);
    TestBed.inject(AuthService).logout();
    expect(s.isAuthenticated()).toBe(false);
  });
});
