import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_USER_KEY, SessionService } from './session.service';
import { usuarioMock } from './auth.testing';

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

  it('empresa null en currentUser rechaza la sesión', () => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ ...usuarioMock, empresa: null }));
    const s = TestBed.inject(SessionService);
    expect(s.usuarioActual()).toBeNull();
    expect(s.isAuthenticated()).toBe(false);
  });

  it('getUserLoggedIn no escribe el signal (seguro dentro de computed)', () => {
    const s = TestBed.inject(SessionService);
    s.setUserLoggedIn(usuarioMock);
    localStorage.removeItem(CURRENT_USER_KEY);
    const c = computed(() => s.getUserLoggedIn());
    expect(c()).toBeNull();
    expect(s.usuarioActual()).toEqual(usuarioMock);
  });

  it('el evento storage sincroniza login y logout de otra pestaña', () => {
    const s = TestBed.inject(SessionService);
    expect(s.usuarioActual()).toBeNull();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock));
    window.dispatchEvent(new StorageEvent('storage', { key: CURRENT_USER_KEY }));
    expect(s.usuarioActual()).toEqual(usuarioMock);
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new StorageEvent('storage', { key: CURRENT_USER_KEY }));
    expect(s.usuarioActual()).toBeNull();
  });

  it('el evento storage de otra clave se ignora y el listener se quita al destruir', () => {
    const s = TestBed.inject(SessionService);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock));
    window.dispatchEvent(new StorageEvent('storage', { key: 'otra' }));
    expect(s.usuarioActual()).toBeNull();
    TestBed.resetTestingModule();
    window.dispatchEvent(new StorageEvent('storage', { key: CURRENT_USER_KEY }));
    expect(s.usuarioActual()).toBeNull();
  });

  it('inicializa el signal desde localStorage', () => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuarioMock));
    expect(TestBed.inject(SessionService).usuarioActual()).toEqual(usuarioMock);
  });
});
