import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { SessionService } from './session.service';
import { usuarioMock } from './testing';

describe('authGuard', () => {
  const navigate = vi.fn();
  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/x' } as RouterStateSnapshot),
    );

  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { navigate } }] });
  });

  it('con sesión permite el acceso', () => {
    TestBed.inject(SessionService).setUserLoggedIn(usuarioMock);
    expect(run()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sin sesión redirige a /sessions/signin (sin returnUrl, como v1)', () => {
    expect(run()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/sessions/signin']);
  });
});
