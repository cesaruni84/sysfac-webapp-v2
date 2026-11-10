import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { Notificacion, NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  let servicio: NotificacionService;
  let recibidas: Notificacion[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(NotificacionService);
    recibidas = [];
    servicio.notificaciones$.subscribe((n) => recibidas.push(n));
  });

  it('publica cada aviso en orden, sin perder los del mismo ciclo', () => {
    servicio.publicar({ severidad: 'info', titulo: 'A' });
    servicio.publicar({ severidad: 'info', titulo: 'B' });
    expect(recibidas.map((n) => n.titulo)).toEqual(['A', 'B']);
  });

  it('los atajos asignan la severidad', () => {
    servicio.exito('ok', 'd1');
    servicio.info('i');
    servicio.advertencia('w');
    servicio.error('e', 'd2');
    expect(recibidas).toEqual([
      { severidad: 'success', titulo: 'ok', detalle: 'd1' },
      { severidad: 'info', titulo: 'i', detalle: undefined },
      { severidad: 'warn', titulo: 'w', detalle: undefined },
      { severidad: 'error', titulo: 'e', detalle: 'd2' },
    ]);
  });
});
