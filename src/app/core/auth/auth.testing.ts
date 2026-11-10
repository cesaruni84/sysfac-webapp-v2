import type { Usuario } from '../models';

/** Usuario de prueba compartido por los specs de auth e interceptores. */
export const usuarioMock = {
  id: 1,
  codigo: 'admin',
  nombres: 'A',
  apellidos: 'B',
  email: 'a@b.c',
  telefono: '1',
  cargo: 'x',
  fechaAlta: '2020-01-01',
  empresa: { id: 2, razonSocial: 'R' },
} as unknown as Usuario;
