import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  completarCeros,
  completarNroDoc,
  completarSecuencia,
  completarSerie,
  correo,
  digitos,
  fecha,
  numero,
  soloDigitos,
} from './index';

const run = (v: ValidatorFn, valor: unknown) => v(new FormControl(valor));

describe('digitos', () => {
  it.each(['0', '123', '00012345', 7, 0])('acepta %s', (v) => expect(run(digitos, v)).toBeNull());
  it.each(['', null, undefined])('acepta vacio (%s)', (v) => expect(run(digitos, v)).toBeNull());
  it.each(['12a', 'a', '1.5', '-1', ' ', ' 1', '1 ', '1,2', 1.5, -3])('rechaza %s', (v) =>
    expect(run(digitos, v)).toEqual({ digits: true }),
  );
  it('con required: espacio inicial de v1 (" ") falla digits', () => {
    const c = new FormControl(' ', [digitos, Validators.required]);
    expect(c.errors).toEqual({ digits: true });
  });
});

describe('numero', () => {
  it.each(['0', '12', '-3', '3.5', '-3.50', '.5', '1,234', '1,234,567.89', '12,345', 5, 3.5, -2])(
    'acepta %s',
    (v) => expect(run(numero, v)).toBeNull(),
  );
  it.each(['', null, undefined])('acepta vacio (%s)', (v) => expect(run(numero, v)).toBeNull());
  it.each(['abc', '1a', '1,23', '1,2345', '--1', '1.', '1..2', '1.2.3', ' 1', '+1', '1e5'])(
    'rechaza %s',
    (v) => expect(run(numero, v)).toEqual({ number: true }),
  );
});

describe('fecha', () => {
  it('acepta Date valida, ISO y timestamps', () => {
    expect(run(fecha, new Date(2024, 0, 31))).toBeNull();
    expect(run(fecha, '2024-01-31')).toBeNull();
    expect(run(fecha, '2024-01-31T10:00:00Z')).toBeNull();
    expect(run(fecha, 1706659200000)).toBeNull();
    expect(run(fecha, 0)).toBeNull();
  });
  it('acepta vacio', () => {
    expect(run(fecha, '')).toBeNull();
    expect(run(fecha, null)).toBeNull();
    expect(run(fecha, undefined)).toBeNull();
  });
  it('rechaza invalidas', () => {
    expect(run(fecha, 'no es fecha')).toEqual({ date: true });
    expect(run(fecha, new Date('x'))).toEqual({ date: true });
    expect(run(fecha, '2024-13-45')).toEqual({ date: true });
    expect(run(fecha, NaN)).toEqual({ date: true });
    // dd/mm/yyyy no es parseable por new Date en V8
    expect(run(fecha, '25/12/2020')).toEqual({ date: true });
  });
});

describe('correo', () => {
  it.each(['a@b.co', 'juan.perez@empresa.com.pe', 'x_y+z@sub.dominio.org', '"a b"@dom.com', 'a@[192.168.0.1]'])(
    'acepta %s',
    (v) => expect(run(correo, v)).toBeNull(),
  );
  it.each(['', null, undefined])('acepta vacio (%s)', (v) => expect(run(correo, v)).toBeNull());
  it.each(['a', 'a@', '@b.com', 'a@b', 'a@b.c', 'a b@c.com', 'a@@b.com', 'a@b..com', 'a@b.com '])(
    'rechaza %s',
    (v) => expect(run(correo, v)).toEqual({ email: true }),
  );
});

describe('soloDigitos', () => {
  it('filtra no digitos', () => {
    expect(soloDigitos('12a3-4 5.6')).toBe('123456');
    expect(soloDigitos('abc')).toBe('');
    expect(soloDigitos('0012')).toBe('0012');
    expect(soloDigitos(1234)).toBe('1234');
  });
  it('vacio/null/undefined', () => {
    expect(soloDigitos('')).toBe('');
    expect(soloDigitos(null)).toBe('');
    expect(soloDigitos(undefined)).toBe('');
  });
});

describe('completarCeros', () => {
  it('completa a la izquierda', () => {
    expect(completarCeros('1', 5)).toBe('00001');
    expect(completarCeros('123', 8)).toBe('00000123');
    expect(completarCeros(7, 3)).toBe('007');
  });
  it('no trunca ni altera longitud exacta o mayor', () => {
    expect(completarCeros('12345', 5)).toBe('12345');
    expect(completarCeros('1234567', 5)).toBe('1234567');
  });
  it('baja a minusculas como v1', () => {
    expect(completarCeros('F1', 5)).toBe('000f1');
  });
  it('vacio/null/undefined devuelve vacio', () => {
    expect(completarCeros('', 5)).toBe('');
    expect(completarCeros(null, 5)).toBe('');
    expect(completarCeros(undefined, 5)).toBe('');
  });
  it('longitud 0 no cambia', () => {
    expect(completarCeros('9', 0)).toBe('9');
  });
});

describe('completar serie / secuencia / nroDoc', () => {
  it('serie 5', () => expect(completarSerie('12')).toBe('00012'));
  it('secuencia 8', () => expect(completarSecuencia('12')).toBe('00000012'));
  it('nro doc 12', () => {
    expect(completarNroDoc('12')).toBe('000000000012');
    expect(completarNroDoc('')).toBe('');
  });
});
