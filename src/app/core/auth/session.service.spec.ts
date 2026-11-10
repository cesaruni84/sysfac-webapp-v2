import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_USER_KEY, SessionService } from './session.service';
import { usuarioMock } from './testing';

describe('SessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('guarda, lee y limpia con la clave currentUser', () => {
    const s = TestBed.inject(SessionService);
    expect(s.isAuthenticated()).toBe(false);
    s.setUserLoggedIn(usuarioMock);
    expect(JSON.parse(localStorage.getItem(CURRENT_USER_KEY) as string)).toEqual(usuarioMock);
    expect(s.getUserLoggedIn()).toEqual(usuarioMock);
    expect(s.usuarioActual()).toEqual(usuarioMock);
    expect(s.isAuthenticated()).toBe(true);
    s.deleteUserLoggedIn();
    expect(localStorage.getItem(CURRENT_USER_KEY)).toBeNull();
    expect(s.usuarioActual()).toBeNull();
  });

  it('JSON corrupto o sin campos clave equivale a sesión vacía', () => {
    localStorage.setItem(CURRENT_USER_KEY, '{no json');
    const s = TestBed.inject(SessionService);
    expect(s.usuarioActual()).toBeNull();
    expect(s.getUserLoggedIn()).toBeNull();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ foo: 1 }));
    expect(s.isAuthenticated()).toBe(false);
  });

  it('inicializa el signal desde localStorage', () => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock));
    expect(TestBed.inject(SessionService).usuarioActual()).toEqual(usuarioMock);
  });
});
