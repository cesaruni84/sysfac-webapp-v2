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

  it('conserva los valores de los enums y constantes de v1', () => {
    expect(GLOSA_TRANSPORTE).toBe('TRANSPORTE');
    expect(EstadoDocumento.ANULADO).toBe(3);
    expect(TipoFactura.CON_GUIAREMISION).toBe('3');
    expect(EstadoGuia.ANULADO).toBe(1);
    expect(TipoBusquedaGuias.GUIAS_NO_FACTURADAS).toBe(2);
    expect(TipoBusquedaLiq.LIQ_NO_FACTURADAS).toBe(2);
    expect(EstadoLiquidacion.VENCIDO).toBe(2);
  });

  it('TiposGenericosDB conserva los catálogos de v1', () => {
    const db = new TiposGenericosDB();
    expect(db.tiposDocumentoDB.map((t) => t.codigo)).toEqual(['01', '07', '08', '03']);
    expect(db.tiposOperacionDB).toHaveLength(10);
    expect(db.formasPagoDB).toHaveLength(5);
    expect(db.monedaDB.map((t) => t.nemonico)).toEqual(['S/', '$']);
    expect(db.tiposIgvDB).toHaveLength(19);
    expect(db.tiposItemFactura).toHaveLength(2);
    expect(db.tipoDocumentoPersona).toHaveLength(3);
    expect(db.tiposEstadoFactura).toHaveLength(3);
  });
});
