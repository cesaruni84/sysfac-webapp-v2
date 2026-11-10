import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { SessionService } from '../auth/session.service';
import { usuarioMock } from '../auth/testing';
import { authErrorInterceptor } from './auth-error.interceptor';

describe('authErrorInterceptor', () => {
  const navigate = vi.fn();
  let http: HttpClient;
  let ctrl: HttpTestingController;

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

  it('401 limpia la sesión y redirige con returnUrl', () => {
    let status = 0;
    http.get('/api/x').subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('/api/x').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(TestBed.inject(SessionService).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/sessions/signin'], {
      queryParams: { returnUrl: '/guias' },
    });
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
