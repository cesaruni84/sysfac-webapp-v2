import { describe, expect, it } from 'vitest';
import type { Balanza, Chofer, Empresa, Factoria, GuiaRemision, Producto, UnidadMedida } from '../../models';
import { ajustarFechaEnvioGuia } from './fechas-guia';
import {
  MOTIVO_TRASLADO_GUIA,
  cargarGuiaEnFormulario,
  construirGuiaAnulacion,
  construirGuiaRegistro,
  datosDeChofer,
  esConsultaPorUrl,
  type ContextoGuia,
  type DatosFormularioGuia,
} from './registro-guia';

const empresa = { id: 1, razonSocial: 'EMP SAC', ruc: '20123456789' } as Empresa;
const remitente: Factoria = { id: 3, refLarga2: 'PLANTA A', ruc: '20111111111', direccion: 'AV 1' };
const destinatario: Factoria = { id: 4, refLarga2: 'PLANTA B', ruc: '20222222222', direccion: 'AV 2' };
const producto: Producto = { id: 7, nombre: 'GLP' };
const unidad: UnidadMedida = { id: 1, valor: 'TN', descripcion: 'TONELADAS' };
const balanza: Balanza = { id: 2, nombre: 'B1', descripcion: 'BALANZA 1' };
const chofer: Chofer = { id: 9, nombres: 'Juan', apellidos: 'Perez', certificado: 'C-1', licencia: 'L-1' };

function datos(extra: Partial<DatosFormularioGuia> = {}): DatosFormularioGuia {
  return {
    serie: '1',
    secuencia: '25',
    estado: '0',
    serieCliente: '3',
    secuenciaCliente: '77',
    fechaEmision: new Date(2024, 0, 15),
    fechaIniTraslado: new Date(2024, 0, 15),
    fechaRecepcion: new Date(2024, 0, 16),
    remitente,
    destinatario,
    producto,
    cantidad: 28.5,
    unidadMedida: unidad,
    balanza: null,
    ticketBalanza: null,
    chofer,
    placaTracto: 'ABC-123',
    placaBombona: 'XYZ-987',
    ...extra,
  };
}

const ctxNuevo: ContextoGuia = { codigoUsuario: 'admin', empresa };

describe('construirGuiaRegistro (alta)', () => {
  const g = construirGuiaRegistro(datos(), ctxNuevo, false);

  it('mantiene el orden de claves de v1 y omite las vacías', () => {
    expect(Object.keys(JSON.parse(JSON.stringify(g)))).toEqual([
      'serie',
      'secuencia',
      'totalCantidad',
      'totalPeso',
      'motivoTraslado',
      'guiaDetalle',
      'tarifa',
      'placaTracto',
      'placaBombona',
      'serieCliente',
      'secuenciaCliente',
      'usuarioRegistro',
      'usuarioActualiza',
      'estado',
      'fechaRemision',
      'fechaTraslado',
      'fechaRecepcion',
      'remitente',
      'destinatario',
      'empresa',
      'chofer',
    ]);
  });

  it('completa serie/secuencia propias y del cliente con ceros', () => {
    expect([g.serie, g.secuencia, g.serieCliente, g.secuenciaCliente]).toEqual(['00001', '00000025', '00003', '00000077']);
  });

  it('totales, motivo y tarifa como v1', () => {
    expect(g.totalCantidad).toBe(28.5);
    expect(g.totalPeso).toBe(0);
    expect(g.motivoTraslado).toBe(MOTIVO_TRASLADO_GUIA);
    expect(g.tarifa).toBe(0);
    expect(g.estado).toBe('0');
    expect(g.usuarioRegistro).toBe('admin');
    expect(g.usuarioActualiza).toBe('admin');
    expect(g.empresa).toBe(empresa);
  });

  it('un único detalle sin id con producto, cantidad, peso 0 y unidad', () => {
    expect(JSON.parse(JSON.stringify(g.guiaDetalle))).toEqual([{ producto, cantidad: 28.5, peso: 0, unidadMedida: unidad }]);
    expect(Object.keys(g.guiaDetalle?.[0] ?? {})).toEqual(['id', 'producto', 'cantidad', 'peso', 'unidadMedida']);
  });

  it('ajusta las tres fechas con el desfase de zona horaria', () => {
    const d = datos();
    expect((g.fechaRemision as Date).getTime()).toBe(ajustarFechaEnvioGuia(d.fechaEmision).getTime());
    expect((g.fechaTraslado as Date).getTime()).toBe(ajustarFechaEnvioGuia(d.fechaIniTraslado).getTime());
    expect((g.fechaRecepcion as Date).getTime()).toBe(ajustarFechaEnvioGuia(d.fechaRecepcion).getTime());
  });

  it('incluye balanza y ticket cuando se informan (ticket vacío se envía como "")', () => {
    const conBalanza = construirGuiaRegistro(datos({ balanza, ticketBalanza: '' }), ctxNuevo, false);
    expect(conBalanza.balanza).toBe(balanza);
    expect(JSON.parse(JSON.stringify(conBalanza)).ticketBalanza).toBe('');
    expect(Object.keys(conBalanza).indexOf('balanza')).toBe(2);
  });

  it('no envía id, liquidación ni documento en una guía nueva', () => {
    expect('id' in JSON.parse(JSON.stringify(g))).toBe(false);
    expect(g.liquidacion).toBeUndefined();
    expect(g.documento).toBeUndefined();
  });
});

describe('construirGuiaRegistro (edición)', () => {
  const ctx: ContextoGuia = {
    ...ctxNuevo,
    idGuia: 55,
    idGuiaDetalle: 66,
    tarifa: 12.5,
    liquidacion: { id: 8 },
    documento: { id: 9 },
  };
  const g = construirGuiaRegistro(datos({ serie: '00002', secuencia: '00000031', estado: '1' }), ctx, true);

  it('id al final, liquidación y documento solo con id, tarifa de la guía', () => {
    const keys = Object.keys(JSON.parse(JSON.stringify(g)));
    expect(keys.slice(-3)).toEqual(['liquidacion', 'documento', 'id']);
    expect(g.id).toBe(55);
    expect(g.liquidacion).toEqual({ id: 8 });
    expect(g.documento).toEqual({ id: 9 });
    expect(g.tarifa).toBe(12.5);
    expect(g.guiaDetalle?.[0].id).toBe(66);
    expect(g.estado).toBe('1');
  });

  it('no completa serie/secuencia propias en la edición (v1), pero sí las del cliente', () => {
    const sinCeros = construirGuiaRegistro(datos({ serie: '2', secuencia: '31' }), ctx, true);
    expect([sinCeros.serie, sinCeros.secuencia]).toEqual(['2', '31']);
    expect([sinCeros.serieCliente, sinCeros.secuenciaCliente]).toEqual(['00003', '00000077']);
  });

  it('liquidación sin id se envía como objeto vacío (v1: new Liquidacion() con id undefined)', () => {
    const r = construirGuiaRegistro(datos(), { ...ctx, liquidacion: {} }, true);
    expect(JSON.parse(JSON.stringify(r)).liquidacion).toEqual({});
  });
});

describe('construirGuiaAnulacion', () => {
  const ahora = new Date(2024, 5, 1, 10, 0, 0);

  it('guía cargada: estado numérico 1, detalle con id y orden de claves de v1', () => {
    const g = construirGuiaAnulacion(datos({ serie: '00001', secuencia: '00000025' }), { ...ctxNuevo, idGuia: 5, idGuiaDetalle: 6, tarifa: 3 }, ahora);
    expect(g.estado).toBe(1);
    expect(Object.keys(JSON.parse(JSON.stringify(g)))).toEqual([
      'id',
      'serie',
      'secuencia',
      'serieCliente',
      'secuenciaCliente',
      'estado',
      'remitente',
      'destinatario',
      'chofer',
      'fechaRemision',
      'fechaTraslado',
      'fechaRecepcion',
      'placaBombona',
      'placaTracto',
      'ticketBalanza',
      'totalCantidad',
      'totalPeso',
      'tarifa',
      'guiaDetalle',
      'empresa',
      'usuarioRegistro',
      'usuarioActualiza',
    ]);
    expect(JSON.parse(JSON.stringify(g.guiaDetalle))).toEqual([{ id: 6, producto, cantidad: 28.5, peso: 0, unidadMedida: unidad }]);
    expect(g.tarifa).toBe(3);
    expect(g.ticketBalanza).toBe('?');
  });

  it('no completa serie/secuencia y no envía motivo, liquidación ni documento', () => {
    const g = construirGuiaAnulacion(datos(), { ...ctxNuevo, idGuia: 5, liquidacion: { id: 1 }, documento: { id: 2 } }, ahora);
    expect([g.serie, g.secuencia]).toEqual(['1', '25']);
    expect(g.motivoTraslado).toBeUndefined();
    expect(g.liquidacion).toBeUndefined();
    expect(g.documento).toBeUndefined();
  });

  it('guía no grabada: sin id y guiaDetalle vacío; vacíos con "?" y 0; fechas vacías = ahora', () => {
    const g = construirGuiaAnulacion(
      datos({
        placaTracto: '',
        placaBombona: '',
        cantidad: null,
        serieCliente: '',
        secuenciaCliente: '',
        fechaEmision: null,
        fechaIniTraslado: null,
        fechaRecepcion: null,
        remitente: null,
      }),
      ctxNuevo,
      ahora,
    );
    const json = JSON.parse(JSON.stringify(g));
    expect('id' in json).toBe(false);
    expect('remitente' in json).toBe(false);
    expect(g.guiaDetalle).toEqual([]);
    expect([g.placaTracto, g.placaBombona, g.ticketBalanza]).toEqual(['?', '?', '?']);
    expect(g.totalCantidad).toBe(0);
    expect([g.serieCliente, g.secuenciaCliente]).toEqual(['', '']);
    expect(g.fechaRemision).toBe(ahora);
    expect(g.fechaTraslado).toBe(ahora);
    expect(g.fechaRecepcion).toBe(ahora);
  });

  it('con fechas las ajusta como el alta', () => {
    const d = datos();
    const g = construirGuiaAnulacion(d, ctxNuevo, ahora);
    expect((g.fechaRemision as Date).getTime()).toBe(ajustarFechaEnvioGuia(d.fechaEmision).getTime());
  });
});

describe('cargarGuiaEnFormulario', () => {
  const guiaApi: GuiaRemision = {
    id: 55,
    serie: '00001',
    secuencia: '00000025',
    estado: 1,
    fechaRemision: '2024-01-15T00:00:00.000Z',
    fechaTraslado: '2024-01-15T00:00:00.000Z',
    fechaRecepcion: '2024-01-16T00:00:00.000Z',
    remitente: { id: 3, refLarga2: 'PLANTA A', cliente: { ruc: '201', direccion: 'DIR A' } },
    destinatario: { id: 4, refLarga2: 'PLANTA B', cliente: { ruc: '202', direccion: 'DIR B' } },
    guiaDetalle: [{ id: 66, producto, unidadMedida: unidad, cantidad: 10 }],
    totalCantidad: 10,
    placaTracto: 'T-1',
    placaBombona: 'B-1',
    chofer,
    balanza,
    ticketBalanza: '123',
    serieCliente: '00003',
    secuenciaCliente: '00000077',
    liquidacion: { id: 8, nrodoc: 'L' },
    documento: { id: 9 },
    tarifa: 12.5,
  };

  it('mapea todos los campos como parsearDatosGuiaRemision de v1', () => {
    const c = cargarGuiaEnFormulario(guiaApi);
    expect(c.idGuia).toBe(55);
    expect(c.estado).toBe('1');
    expect(c.anulada).toBe(true);
    expect(c.remitente).toEqual({ factoria: guiaApi.remitente, ruc: '201', direccion: 'DIR A' });
    expect(c.destinatario).toEqual({ factoria: guiaApi.destinatario, ruc: '202', direccion: 'DIR B' });
    expect(c.detalle).toEqual({ id: 66, producto, unidadMedida: unidad });
    expect(c.chofer).toEqual({ chofer, certificado: 'C-1', licencia: 'L-1' });
    expect(c.balanza).toBe(balanza);
    expect([c.cantidad, c.placaTracto, c.placaBombona, c.ticketBalanza]).toEqual([10, 'T-1', 'B-1', '123']);
    expect([c.serie, c.secuencia, c.serieCliente, c.secuenciaCliente]).toEqual(['00001', '00000025', '00003', '00000077']);
    expect(c.liquidacion).toBe(guiaApi.liquidacion);
    expect(c.documento).toBe(guiaApi.documento);
    expect(c.tarifa).toBe(12.5);
    expect(c.fechaEmision).toBeInstanceOf(Date);
  });

  it('guía mínima: sin bloques opcionales, id 0, textos vacíos', () => {
    const c = cargarGuiaEnFormulario({ estado: 0, guiaDetalle: [] });
    expect(c.idGuia).toBe(0);
    expect(c.estado).toBe('0');
    expect(c.anulada).toBe(false);
    expect(c.remitente).toBeUndefined();
    expect(c.detalle).toBeUndefined();
    expect(c.chofer).toBeUndefined();
    expect(c.balanza).toBeUndefined();
    expect([c.ticketBalanza, c.serieCliente, c.secuenciaCliente]).toEqual(['', '', '']);
    expect(c.fechaEmision).toBeNull();
  });

  it('cargar y volver a grabar reproduce el ida y vuelta de fechas de v1', () => {
    const c = cargarGuiaEnFormulario(guiaApi);
    const g = construirGuiaRegistro(
      datos({ fechaEmision: c.fechaEmision, fechaIniTraslado: c.fechaIniTraslado, fechaRecepcion: c.fechaRecepcion }),
      ctxNuevo,
      true,
    );
    const base = new Date('2024-01-15T00:00:00.000Z');
    const off = base.getTimezoneOffset() * 60 * 1000;
    expect((g.fechaRemision as Date).getTime()).toBe(base.getTime() + 2 * off);
  });
});

describe('datosDeChofer', () => {
  it('copia certificado, licencia y placas del vehículo', () => {
    const r = datosDeChofer({ ...chofer, vehiculo: { placaTracto: 'T-9', placaBombona: 'B-9' } });
    expect(r).toEqual({ certificado: 'C-1', licencia: 'L-1', placaTracto: 'T-9', placaBombona: 'B-9' });
  });

  it('sin vehículo no toca las placas', () => {
    const r = datosDeChofer(chofer);
    expect(r.placaTracto).toBeUndefined();
    expect(r.placaBombona).toBeUndefined();
  });
});

describe('esConsultaPorUrl', () => {
  it('requiere _serie y _secuencia', () => {
    expect(esConsultaPorUrl('00001', '00000025')).toBe(true);
    expect(esConsultaPorUrl('00001', null)).toBe(false);
    expect(esConsultaPorUrl(null, '00000025')).toBe(false);
    expect(esConsultaPorUrl(null, null)).toBe(false);
  });
});
