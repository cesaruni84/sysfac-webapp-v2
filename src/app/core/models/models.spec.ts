import {
  Cliente,
  Documento,
  EstadoDocumento,
  EstadoGuia,
  GLOSA_TRANSPORTE,
  GuiaRemision,
  TipoBusquedaGuias,
  TipoBusquedaLiq,
  EstadoLiquidacion,
  TipoFactura,
  TiposGenericosDB,
  UsuarioForm,
} from './index';

/** Literales copiados tal cual de v1 (tiposGenericosDB.ts), sin las entradas comentadas. */
const V1 = {
  tiposDocumentoDB: [
    { id: 1, codigo: '01', descripcion: 'Factura', nemonico: '01 - Factura' },
    { id: 2, codigo: '07', descripcion: 'Nota de Crédito', nemonico: '02 - Nota de Crédito' },
    { id: 3, codigo: '08', descripcion: 'Nota de Débito', nemonico: '03 - Nota de Débito' },
    { id: 4, codigo: '03', descripcion: 'Boleta de Venta', nemonico: '04 - Boleta de Venta' },
  ],
  tiposOperacionDB: [
    { id: 1, codigo: '0101', descripcion: 'Venta Interna', nemonico: '' },
    { id: 2, codigo: '0102', descripcion: 'Exportación', nemonico: '' },
    { id: 3, codigo: '0103', descripcion: 'No Domiciliados', nemonico: '' },
    { id: 4, codigo: '0104', descripcion: 'Venta Interna - Anticipos', nemonico: '' },
    { id: 5, codigo: '0105', descripcion: 'Venta Itinerante', nemonico: '' },
    { id: 6, codigo: '0106', descripcion: 'Factura Guía', nemonico: '' },
    { id: 7, codigo: '0107', descripcion: 'Venta Arroz Pilado', nemonico: '' },
    { id: 8, codigo: '0108', descripcion: 'Factura - Comprobante de Percepción', nemonico: '' },
    { id: 9, codigo: '0110', descripcion: 'Factura - Guía remitente', nemonico: '' },
    { id: 10, codigo: '0111', descripcion: 'Factura - Guía transportista', nemonico: '' },
  ],
  formasPagoDB: [
    { id: 1, codigo: '001', descripcion: 'Contado', nemonico: '1 - Contado' },
    { id: 2, codigo: '002', descripcion: 'Pago a 30 días', nemonico: '2 - Pago a 30 días' },
    { id: 3, codigo: '003', descripcion: 'Pago a 60 días', nemonico: '3 - Pago a 60 días' },
    { id: 4, codigo: '004', descripcion: 'Pago a 90 días', nemonico: '4 - Pago a 90 días' },
    { id: 5, codigo: '005', descripcion: 'Pago a 120 días', nemonico: '5 - Pago a 120 días' },
  ],
  monedaDB: [
    { id: 1, codigo: '001', descripcion: 'Soles (S/)', nemonico: 'S/' },
    { id: 2, codigo: '002', descripcion: 'Dólares ($)', nemonico: '$' },
  ],
  tiposIgvDB: [
    { id: 1, codigo: '10', descripcion: 'Gravado - Operación Onerosa', nemonico: 'Gravado' },
    { id: 2, codigo: '11', descripcion: 'Gravado – Retiro por premio', nemonico: 'Gravado' },
    { id: 3, codigo: '12', descripcion: 'Gravado – Retiro por donación', nemonico: 'Gravado' },
    { id: 4, codigo: '13', descripcion: 'Gravado – Retiro', nemonico: 'Gravado' },
    { id: 5, codigo: '14', descripcion: 'Gravado – Retiro por publicidad', nemonico: 'Gravado' },
    { id: 6, codigo: '15', descripcion: 'Gravado – Bonificaciones', nemonico: 'Gravado' },
    { id: 7, codigo: '16', descripcion: 'Gravado – Retiro por entrega a trabajadores', nemonico: 'Gravado' },
    { id: 8, codigo: '17', descripcion: 'Gravado – IVAP', nemonico: 'Gravado' },
    { id: 9, codigo: '20', descripcion: 'Exonerado - Operación Onerosa', nemonico: 'Exonerado' },
    { id: 10, codigo: '21', descripcion: 'Exonerado – Transferencia Gratuita', nemonico: 'Exonerado' },
    { id: 11, codigo: '30', descripcion: 'Inafecto - Operación Onerosa', nemonico: 'Inafecto' },
    { id: 12, codigo: '31', descripcion: 'Inafecto – Retiro por Bonificación', nemonico: 'Inafecto' },
    { id: 13, codigo: '32', descripcion: 'Inafecto – Retiro', nemonico: 'Inafecto' },
    { id: 14, codigo: '33', descripcion: 'Inafecto – Retiro por Muestras Médicas', nemonico: 'Inafecto' },
    { id: 15, codigo: '34', descripcion: 'Inafecto - Retiro por Convenio Colectivo', nemonico: 'Inafecto' },
    { id: 16, codigo: '35', descripcion: 'Inafecto – Retiro por premio', nemonico: 'Inafecto' },
    { id: 17, codigo: '36', descripcion: 'Inafecto - Retiro por publicidad', nemonico: 'Inafecto' },
    { id: 18, codigo: '37', descripcion: 'Inafecto - Transferencia Gratuita', nemonico: 'Inafecto' },
    { id: 19, codigo: '40', descripcion: 'Exportación', nemonico: '' },
  ],
  tiposItemFactura: [
    { id: 1, codigo: '001', descripcion: ' BIEN' },
    { id: 2, codigo: '002', descripcion: ' SERVICIO' },
  ],
  tipoDocumentoPersona: [
    { id: 1, codigo: '001', descripcion: ' RUC' },
    { id: 2, codigo: '002', descripcion: ' DNI' },
    { id: 3, codigo: '003', descripcion: ' OTRO' },
  ],
  tiposEstadoFactura: [
    { id: 1, codigo: '001', descripcion: 'Registrado' },
    { id: 2, codigo: '002', descripcion: 'Cancelado' },
    { id: 3, codigo: '003', descripcion: 'Anulado' },
  ],
};

describe('core/models', () => {
  it('UsuarioForm arma el JSON de login igual que v1', () => {
    const form = new UsuarioForm('admin', 'clave', 3);
    expect(JSON.parse(JSON.stringify(form))).toEqual({
      txtCodigoUsuario: 'admin',
      txtClaveUsuario: 'clave',
      txtCodigoEmpresa: 3,
    });
  });

  it('las clases sin asignar serializan como {} (igual que v1)', () => {
    expect(JSON.stringify(new GuiaRemision())).toBe('{}');
    expect(JSON.stringify(new Documento())).toBe('{}');
    const c = new Cliente();
    c.ruc = '20123456789';
    expect(JSON.stringify(c)).toBe('{"ruc":"20123456789"}');
  });

  it('un modelo con fecha acepta string ISO (respuesta del backend) y serializa igual', () => {
    const iso = '2024-05-10T15:30:00.000Z';
    const desdeString = new GuiaRemision();
    desdeString.fechaRemision = iso;
    const desdeDate = new GuiaRemision();
    desdeDate.fechaRemision = new Date(iso);
    expect(JSON.stringify(desdeString)).toBe(JSON.stringify(desdeDate));
    expect(new Date(desdeString.fechaRemision).getTime()).toBe(Date.parse(iso));
  });

  it('conserva todos los miembros de los enums y constantes de v1', () => {
    expect(GLOSA_TRANSPORTE).toBe('TRANSPORTE');

    expect(EstadoDocumento.REGISTRADO).toBe(1);
    expect(EstadoDocumento.CANCELADO).toBe(2);
    expect(EstadoDocumento.ANULADO).toBe(3);

    expect(TipoFactura.ITEM).toBe('1');
    expect(TipoFactura.CON_LIQUIDACION).toBe('2');
    expect(TipoFactura.CON_GUIAREMISION).toBe('3');

    expect(EstadoGuia.REGISTRADO).toBe(0);
    expect(EstadoGuia.ANULADO).toBe(1);

    expect(TipoBusquedaGuias.TODOS).toBe(0);
    expect(TipoBusquedaGuias.GUIAS_FACTURADAS).toBe(1);
    expect(TipoBusquedaGuias.GUIAS_NO_FACTURADAS).toBe(2);

    expect(TipoBusquedaLiq.TODOS).toBe(0);
    expect(TipoBusquedaLiq.LIQ_FACTURADAS).toBe(1);
    expect(TipoBusquedaLiq.LIQ_NO_FACTURADAS).toBe(2);

    expect(EstadoLiquidacion.TODOS).toBe(0);
    expect(EstadoLiquidacion.VIGENTE).toBe(1);
    expect(EstadoLiquidacion.VENCIDO).toBe(2);
  });

  it('TiposGenericosDB coincide con los catálogos de v1', () => {
    const db = new TiposGenericosDB();
    expect(db.tiposDocumentoDB).toEqual(V1.tiposDocumentoDB);
    expect(db.tiposOperacionDB).toEqual(V1.tiposOperacionDB);
    expect(db.formasPagoDB).toEqual(V1.formasPagoDB);
    expect(db.monedaDB).toEqual(V1.monedaDB);
    expect(db.tiposIgvDB).toEqual(V1.tiposIgvDB);
    expect(db.tiposItemFactura).toEqual(V1.tiposItemFactura);
    expect(db.tipoDocumentoPersona).toEqual(V1.tipoDocumentoPersona);
    expect(db.tiposEstadoFactura).toEqual(V1.tiposEstadoFactura);
  });
});
