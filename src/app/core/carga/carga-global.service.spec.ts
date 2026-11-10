import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CargaGlobalService, MENSAJE_CARGA_POR_DEFECTO } from './carga-global.service';

describe('CargaGlobalService', () => {
  let carga: CargaGlobalService;

  beforeEach(() => {
    carga = TestBed.inject(CargaGlobalService);
  });

  it('inicia inactivo y sin mensaje', () => {
    expect(carga.activo()).toBe(false);
    expect(carga.contador()).toBe(0);
    expect(carga.mensaje()).toBe('');
  });

  it('abrir sin mensaje usa "Procesando" como v1', () => {
    carga.abrir();
    expect(carga.activo()).toBe(true);
    expect(carga.mensaje()).toBe(MENSAJE_CARGA_POR_DEFECTO);
    expect(MENSAJE_CARGA_POR_DEFECTO).toBe('Procesando');
  });

  it('con aperturas anidadas sigue activo hasta el último cierre y muestra el mensaje más reciente', () => {
    carga.abrir('Cargando guías');
    carga.abrir('Cargando choferes');
    expect(carga.contador()).toBe(2);
    expect(carga.mensaje()).toBe('Cargando choferes');

    carga.cerrar();
    expect(carga.activo()).toBe(true);
    expect(carga.mensaje()).toBe('Cargando guías');

    carga.cerrar();
    expect(carga.activo()).toBe(false);
    expect(carga.mensaje()).toBe('');
  });

  it('cerrar de más no deja el contador en negativo', () => {
    carga.cerrar();
    carga.cerrar();
    expect(carga.contador()).toBe(0);
    carga.abrir();
    expect(carga.activo()).toBe(true);
    carga.cerrar();
    expect(carga.activo()).toBe(false);
  });

  it('cerrarTodo cierra todas las aperturas', () => {
    carga.abrir();
    carga.abrir();
    carga.cerrarTodo();
    expect(carga.activo()).toBe(false);
  });

  it('ejecutar abre durante la tarea, devuelve su resultado y cierra', async () => {
    let activoDurante = false;
    const r = await carga.ejecutar(async () => {
      activoDurante = carga.activo();
      return 42;
    }, 'Guardando');
    expect(activoDurante).toBe(true);
    expect(r).toBe(42);
    expect(carga.activo()).toBe(false);
  });

  it('ejecutar cierra aunque la tarea falle y propaga el error', async () => {
    await expect(carga.ejecutar(() => Promise.reject(new Error('falló')))).rejects.toThrow('falló');
    expect(carga.activo()).toBe(false);
  });
});
