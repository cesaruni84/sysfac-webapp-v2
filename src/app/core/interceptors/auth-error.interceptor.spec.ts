import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { SessionService } from '../auth/session.service';
import { usuarioMock } from '../auth/auth.testing';
import { Notificacion, NotificacionService } from '../notifications/notificacion.service';
import {
  AVISO_ERROR_SERVIDOR,
  AVISO_SIN_CONEXION,
  authErrorInterceptor,
} from './auth-error.interceptor';

describe('authErrorInterceptor', () => {
  const navigate = vi.fn();
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let avisos: Notificacion[];

  /** Hace un GET que falla con `status` y devuelve el status propagado. */
  function fallarCon(status: number, body: unknown = { codeMessage: 'E1' }): number {
    let propagado = -1;
    http.get('/api/x').subscribe({ error: (e) => (propagado = e.status) });
    const req = ctrl.expectOne('/api/x');
    if (status === 0) req.error(new ProgressEvent('error'), { status: 0, statusText: '' });
    else req.flush(body, { status, statusText: 'x' });
    return propagado;
  }

  describe('avisos globales (toast)', () => {
    beforeEach(() => {
      avisos = [];
      TestBed.inject(NotificacionService).notificaciones$.subscribe((n) => avisos.push(n));
    });

    it('status 0 publica "Sin conexión con el servidor" y propaga el error', () => {
      expect(fallarCon(0)).toBe(0);
      expect(avisos).toEqual([{ severidad: 'error', ...AVISO_SIN_CONEXION }]);
    });

    it.each([500, 502, 503])('%s publica "Error del servidor" y propaga el error', (status) => {
      expect(fallarCon(status)).toBe(status);
      expect(avisos).toEqual([{ severidad: 'error', ...AVISO_ERROR_SERVIDOR }]);
    });

    it.each([400, 401, 404, 409, 422])('%s no publica aviso global', (status) => {
      expect(fallarCon(status)).toBe(status);
      expect(avisos).toEqual([]);
    });

    it('401 del login tampoco publica aviso', () => {
      http.post(`${environment.apiUrl}/login`, {}).subscribe({ error: () => undefined });
      ctrl.expectOne(`${environment.apiUrl}/login`).flush({}, { status: 401, statusText: 'x' });
      expect(avisos).toEqual([]);
    });

    it('una respuesta correcta no publica aviso', () => {
      http.get('/api/x').subscribe();
      ctrl.expectOne('/api/x').flush({});
      expect(avisos).toEqual([]);
    });
  });

  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate, url: '/guias' } },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    TestBed.inject(SessionService).setUserLoggedIn(usuarioMock);
  });

  it('401 limpia la sesión y navega a signin sin returnUrl', () => {
    let status = 0;
    http.get('/api/x').subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('/api/x').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    const session = TestBed.inject(SessionService);
    expect(session.isAuthenticated()).toBe(false);
    expect(session.usuarioActual()).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/sessions/signin']);
  });

  it('401 estando en /sessions/* limpia y propaga sin navegar', () => {
    (TestBed.inject(Router) as { url: string }).url = '/sessions/signin';
    let status = 0;
    http.get('/api/x').subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('/api/x').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(SessionService).usuarioActual()).toBeNull();
  });

  it('401 del propio login no redirige ni limpia', () => {
    http.post(`${environment.apiUrl}/login`, {}).subscribe({ error: () => undefined });
    ctrl.expectOne(`${environment.apiUrl}/login`).flush({}, { status: 401, statusText: 'x' });
    expect(navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(SessionService).isAuthenticated()).toBe(true);
  });

  it('500 se propaga sin modificar y no toca la sesión', () => {
    let err: { status: number; error: { codeMessage: string } } | undefined;
    http.get('/api/x').subscribe({ error: (e) => (err = e) });
    ctrl.expectOne('/api/x').flush({ codeMessage: 'E1' }, { status: 500, statusText: 'Err' });
    expect(err?.status).toBe(500);
    expect(err?.error.codeMessage).toBe('E1');
    expect(navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(SessionService).isAuthenticated()).toBe(true);
  });
});
