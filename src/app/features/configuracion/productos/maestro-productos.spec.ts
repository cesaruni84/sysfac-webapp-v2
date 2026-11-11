import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Producto } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ProductoService } from '../../../core/services';
import { MaestroProductos, MENSAJE_ERROR_GENERICO, glosaTipoProducto } from './maestro-productos';

const datos: Producto[] = [
  {
    id: 7,
    codigo: 'GLP',
    nombre: 'Gas licuado',
    descripcion: 'd',
    stock: 10,
    precio: 5,
    fechaIngreso: '2021-03-15',
    categoria: { id: 1, nombre: 'BIEN' },
  },
  {
    id: 8,
    codigo: 'FLE',
    nombre: 'Flete',
    stock: 0,
    precio: 0,
    fechaIngreso: '2021-03-16',
    categoria: { id: 2, nombre: 'SERVICIO' },
  },
];

describe('MaestroProductos', () => {
  let fixture: ComponentFixture<MaestroProductos>;
  let comp: MaestroProductos;
  const listarComboProductos = vi.fn();
  const registrarProducto = vi.fn();
  const actualizarProducto = vi.fn();
  const error = vi.fn();
  const exito = vi.fn();

  async function crear() {
    fixture = TestBed.createComponent(MaestroProductos);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    listarComboProductos.mockReturnValue(of(datos));
    registrarProducto.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    actualizarProducto.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'ok' }));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProductoService,
          useValue: { listarComboProductos, registrarProducto, actualizarProducto },
        },
        { provide: NotificacionService, useValue: { error, exito } },
      ],
    });
    await crear();
  });

  it('carga el listado y pinta las filas con la glosa del tipo', () => {
    expect(comp.productos()).toEqual(datos);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Gas licuado');
    expect(texto).toContain('BIEN');
    expect(texto).toContain('SERVICIO');
    expect(glosaTipoProducto(undefined)).toBe('');
  });

  it('las filas llevan la glosa del tipo (el buscador la encuentra) sin alterar los datos', () => {
    expect(comp.filas().map((f) => f.tipoGlosa)).toEqual(['BIEN', 'SERVICIO']);
    expect(comp.productos()[0]).not.toHaveProperty('tipoGlosa');
  });

  it('el alta envía el JSON de v1 con valores por defecto', async () => {
    comp.abrir();
    expect(comp.form.getRawValue()).toMatchObject({ tipoProducto: 1, stock: 0, precio: 0 });
    comp.form.patchValue({ codigo: 'X1', nombre: 'Nuevo', descripcion: 'desc', stock: 3.5, precio: 12 });
    await comp.guardar();
    expect(registrarProducto).toHaveBeenCalledWith({
      categoria: { id: 1 },
      codigo: 'X1',
      nombre: 'Nuevo',
      descripcion: 'desc',
      stock: 3.5,
      precio: 12,
    });
    expect(exito).toHaveBeenCalledWith('Registro añadido correctamente !');
    expect(comp.dialogoVisible()).toBe(false);
    expect(listarComboProductos).toHaveBeenCalledTimes(2);
  });

  it('la edición precarga el formulario y envía el id', async () => {
    comp.alAccion({ accion: 'editar', fila: comp.filas()[1] });
    expect(comp.dialogoVisible()).toBe(true);
    expect(comp.form.getRawValue().tipoProducto).toBe(2);
    comp.form.patchValue({ nombre: 'Flete 2' });
    await comp.guardar();
    expect(actualizarProducto).toHaveBeenCalledWith({
      categoria: { id: 2 },
      codigo: 'FLE',
      nombre: 'Flete 2',
      descripcion: '',
      stock: 0,
      precio: 0,
      id: 8,
    });
    expect(exito).toHaveBeenCalledWith('Registro actualizado correctamente !');
  });

  it('un campo obligatorio tocado y vacío queda con aria-invalid y muestra el mensaje', async () => {
    comp.abrir();
    comp.form.controls.codigo.markAsTouched();
    comp.form.controls.stock.setValue(null);
    comp.form.controls.stock.setErrors({ number: true });
    comp.form.controls.stock.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const codigo = document.querySelector('[data-testid="codigo"]') as HTMLElement;
    expect(codigo.getAttribute('aria-invalid')).toBe('true');
    expect(codigo.getAttribute('aria-describedby')).toBe('codigo-error');
    expect(document.getElementById('codigo-error')?.textContent).toContain('REQUERIDO');
    const stock = document.querySelector('#stock') as HTMLElement;
    expect(stock.getAttribute('aria-invalid')).toBe('true');
    expect(stock.getAttribute('aria-describedby')).toBe('stock-error');
  });

  it('no guarda un formulario inválido', async () => {
    comp.abrir();
    await comp.guardar();
    expect(registrarProducto).not.toHaveBeenCalled();
    expect(comp.form.invalid).toBe(true);
  });

  it('muestra errorMessage del backend y mantiene el diálogo abierto', async () => {
    registrarProducto.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'E1', errorMessage: 'Código duplicado' } })),
    );
    comp.abrir();
    comp.form.patchValue({ codigo: 'X1', nombre: 'Nuevo' });
    await comp.guardar();
    expect(error).toHaveBeenCalledWith('Error', 'Código duplicado');
    expect(comp.dialogoVisible()).toBe(true);
    expect(comp.guardando()).toBe(false);
  });

  it('usa el mensaje genérico si no viene errorMessage', async () => {
    actualizarProducto.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: 'boom' })));
    comp.abrir(datos[0]);
    await comp.guardar();
    expect(error).toHaveBeenCalledWith('Error', MENSAJE_ERROR_GENERICO);
  });
});
