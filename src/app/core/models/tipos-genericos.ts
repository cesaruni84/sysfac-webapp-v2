import type { TipoGenerico } from './tipos-facturacion';

/** Catálogos fijos de v1 (mismos valores, ids y códigos). */
export class TiposGenericosDB {
  readonly tiposDocumentoDB: TipoGenerico[] = [
    { id: 1, codigo: '01', descripcion: 'Factura', nemonico: '01 - Factura' },
    { id: 2, codigo: '07', descripcion: 'Nota de Crédito', nemonico: '02 - Nota de Crédito' },
    { id: 3, codigo: '08', descripcion: 'Nota de Débito', nemonico: '03 - Nota de Débito' },
    { id: 4, codigo: '03', descripcion: 'Boleta de Venta', nemonico: '04 - Boleta de Venta' },
  ];

  readonly tiposOperacionDB: TipoGenerico[] = [
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
  ];

  readonly formasPagoDB: TipoGenerico[] = [
    { id: 1, codigo: '001', descripcion: 'Contado', nemonico: '1 - Contado' },
    { id: 2, codigo: '002', descripcion: 'Pago a 30 días', nemonico: '2 - Pago a 30 días' },
    { id: 3, codigo: '003', descripcion: 'Pago a 60 días', nemonico: '3 - Pago a 60 días' },
    { id: 4, codigo: '004', descripcion: 'Pago a 90 días', nemonico: '4 - Pago a 90 días' },
    { id: 5, codigo: '005', descripcion: 'Pago a 120 días', nemonico: '5 - Pago a 120 días' },
  ];

  readonly monedaDB: TipoGenerico[] = [
    { id: 1, codigo: '001', descripcion: 'Soles (S/)', nemonico: 'S/' },
    { id: 2, codigo: '002', descripcion: 'Dólares ($)', nemonico: '$' },
  ];

  readonly tiposIgvDB: TipoGenerico[] = [
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
  ];

  readonly tiposItemFactura: TipoGenerico[] = [
    { id: 1, codigo: '001', descripcion: ' BIEN' },
    { id: 2, codigo: '002', descripcion: ' SERVICIO' },
  ];

  readonly tipoDocumentoPersona: TipoGenerico[] = [
    { id: 1, codigo: '001', descripcion: ' RUC' },
    { id: 2, codigo: '002', descripcion: ' DNI' },
    { id: 3, codigo: '003', descripcion: ' OTRO' },
  ];

  readonly tiposEstadoFactura: TipoGenerico[] = [
    { id: 1, codigo: '001', descripcion: 'Registrado' },
    { id: 2, codigo: '002', descripcion: 'Cancelado' },
    { id: 3, codigo: '003', descripcion: 'Anulado' },
  ];
}
