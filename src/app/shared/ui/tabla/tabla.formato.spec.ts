import { describe, expect, it } from 'vitest';

import {
  alineacionColumna,
  claseAlineacion,
  formatearCelda,
  formatearValor,
  idColumna,
  resolverCampo,
  tagCelda,
} from './tabla.formato';
import type { ColumnaTabla, RutaCampo } from './tabla.types';

interface Fila {
  id: number;
  nombre?: string | null;
  importe?: number | string;
  fecha?: string | Date;
  estado?: number;
  moneda?: string;
  empresa?: { razonSocial?: string; ubigeo?: { departamento?: string } };
  items?: { id: number }[];
}

const fila: Fila = {
  id: 7,
  nombre: 'Juan',
  importe: 1234.5,
  fecha: '2021-03-15T12:00:00',
  estado: 1,
  moneda: '$',
  empresa: { razonSocial: 'Transportes SAC', ubigeo: { departamento: 'Lima' } },
};

const L = 'en-US';

describe('RutaCampo (tipos)', () => {
  it('acepta claves y rutas anidadas válidas', () => {
    const rutas: RutaCampo<Fila>[] = ['id', 'empresa.razonSocial', 'empresa.ubigeo.departamento'];
    // @ts-expect-error ruta inexistente
    const mala: RutaCampo<Fila> = 'empresa.noExiste';
    // @ts-expect-error no entra en arreglos
    const arreglo: RutaCampo<Fila> = 'items.id';
    expect(rutas).toHaveLength(3);
    expect([mala, arreglo]).toHaveLength(2);
  });
});

describe('resolverCampo', () => {
  it('lee claves directas y rutas con punto', () => {
    expect(resolverCampo(fila, 'nombre')).toBe('Juan');
    expect(resolverCampo(fila, 'empresa.razonSocial')).toBe('Transportes SAC');
    expect(resolverCampo(fila, 'empresa.ubigeo.departamento')).toBe('Lima');
  });

  it('devuelve undefined si falta un tramo', () => {
    expect(resolverCampo({ id: 1 }, 'empresa.razonSocial')).toBeUndefined();
    expect(resolverCampo({ empresa: null }, 'empresa.razonSocial')).toBeUndefined();
    expect(resolverCampo(null, 'id')).toBeUndefined();
  });
});

describe('formatearCelda', () => {
  it('texto: valor tal cual; vacíos como cadena vacía', () => {
    expect(formatearCelda(fila, { campo: 'nombre', titulo: 'N' }, L)).toBe('Juan');
    expect(formatearCelda({ ...fila, nombre: null }, { campo: 'nombre', titulo: 'N' }, L)).toBe('');
    expect(formatearCelda<Fila>({ id: 1 }, { campo: 'empresa.razonSocial', titulo: 'E' }, L)).toBe('');
  });

  it('valores anidados', () => {
    expect(formatearCelda(fila, { campo: 'empresa.razonSocial', titulo: 'Empresa' }, L)).toBe(
      'Transportes SAC',
    );
  });

  it('moneda: 2 decimales como v1 (number: 1.2-2), con símbolo fijo, por fila o sin símbolo', () => {
    const base: ColumnaTabla<Fila> = { campo: 'importe', titulo: 'Importe', tipo: 'moneda' };
    expect(formatearCelda(fila, base, L)).toBe('1,234.50');
    expect(formatearCelda(fila, { ...base, moneda: 'S/' }, L)).toBe('S/ 1,234.50');
    expect(formatearCelda(fila, { ...base, moneda: (f) => f.moneda ?? '' }, L)).toBe('$ 1,234.50');
    expect(formatearCelda({ ...fila, importe: '10.456' }, base, L)).toBe('10.46');
    expect(formatearCelda({ ...fila, importe: 'abc' }, base, L)).toBe('abc');
  });

  it('numero: hasta 2 decimales por defecto o digitos propios', () => {
    const col: ColumnaTabla<Fila> = { campo: 'importe', titulo: 'Cant.', tipo: 'numero' };
    expect(formatearCelda({ ...fila, importe: 10 }, col, L)).toBe('10');
    expect(formatearCelda({ ...fila, importe: 10.5 }, col, L)).toBe('10.5');
    expect(formatearCelda({ ...fila, importe: 10.5 }, { ...col, digitos: '1.3-3' }, L)).toBe('10.500');
  });

  it('fecha: dd/MM/yyyy por defecto (como v1), acepta string ISO y Date, y patrón propio', () => {
    const col: ColumnaTabla<Fila> = { campo: 'fecha', titulo: 'F.', tipo: 'fecha' };
    expect(formatearCelda(fila, col, L)).toBe('15/03/2021');
    expect(formatearCelda({ ...fila, fecha: new Date(2020, 0, 5) }, col, L)).toBe('05/01/2020');
    expect(formatearCelda({ ...fila, fecha: '2020-01-05' }, col, L)).toBe('05/01/2020');
    expect(formatearCelda(fila, { ...col, formatoFecha: 'dd/MM/yyyy HH:mm' }, L)).toBe('15/03/2021 12:00');
    expect(formatearCelda({ ...fila, fecha: 'no es fecha' }, col, L)).toBe('no es fecha');
  });

  it('formato propio tiene prioridad', () => {
    const col: ColumnaTabla<Fila> = {
      campo: 'estado',
      titulo: 'Estado',
      tipo: 'numero',
      formato: (v) => (v === 1 ? 'Activo' : 'Inactivo'),
    };
    expect(formatearCelda(fila, col, L)).toBe('Activo');
  });
});

describe('formatearValor sin fila (totales)', () => {
  it('formatea números según el tipo y omite el símbolo por fila', () => {
    expect(formatearValor(99.9, { campo: 'importe', titulo: 'I', tipo: 'moneda', moneda: 'S/' }, L)).toBe(
      'S/ 99.90',
    );
    expect(
      formatearValor(5, { campo: 'importe', titulo: 'I', tipo: 'moneda', moneda: () => 'X' } as ColumnaTabla<Fila>, L),
    ).toBe('5.00');
  });
});

describe('tagCelda', () => {
  it('usa la función tag o el valor tal cual', () => {
    const col: ColumnaTabla<Fila> = {
      campo: 'estado',
      titulo: 'Estado',
      tipo: 'tag',
      tag: (v) => (v === 1 ? { texto: 'Anulado', severidad: 'danger' } : { texto: 'Registrado' }),
    };
    expect(tagCelda(fila, col)).toEqual({ texto: 'Anulado', severidad: 'danger' });
    expect(tagCelda(fila, { campo: 'nombre', titulo: 'N', tipo: 'tag' })).toEqual({ texto: 'Juan' });
    expect(tagCelda<Fila>({ id: 1 }, { campo: 'nombre', titulo: 'N', tipo: 'tag' })).toBeNull();
  });
});

describe('alineación e id', () => {
  it('derecha en números, centro en tags, izquierda en el resto, o la indicada', () => {
    expect(alineacionColumna<Fila>({ campo: 'importe', titulo: '', tipo: 'moneda' })).toBe('derecha');
    expect(alineacionColumna<Fila>({ campo: 'importe', titulo: '', tipo: 'numero' })).toBe('derecha');
    expect(alineacionColumna<Fila>({ campo: 'estado', titulo: '', tipo: 'tag' })).toBe('centro');
    expect(alineacionColumna<Fila>({ campo: 'nombre', titulo: '' })).toBe('izquierda');
    expect(claseAlineacion<Fila>({ campo: 'nombre', titulo: '', alineacion: 'centro' })).toBe('text-center');
  });

  it('idColumna usa id o campo', () => {
    expect(idColumna<Fila>({ campo: 'id', titulo: '' })).toBe('id');
    expect(idColumna<Fila>({ campo: 'id', titulo: '', id: 'item' })).toBe('item');
  });
});
