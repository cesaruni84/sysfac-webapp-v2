import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import { usuarioMock } from '../../../core/auth/auth.testing';
import type { Documento } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import { ItemFacturaService } from '../../../core/services';
import { MENSAJE_ERROR_GENERICO } from '../facturacion-comun';
import { AuditoriaFacturas } from './auditoria-facturas';

const docs: Documento[] = [
  {
    id: 20,
    tipoDocumento: 1,
    serie: 'F002',
    secuencia: '00000005',
    estado: 1,
    notas: '2',
    observacion: 'x',
    totalDocumento: 99.9,
    fechaEmision: '2021-01-20',
    cliente: { id: 7, razonSocial: 'ACME SAC' },
    moneda: { id: 1, nemonico: 'S/' },
  },
];

describe('AuditoriaFacturas', () => {
  let fixture: ComponentFixture<AuditoriaFacturas>;
  let comp: AuditoriaFacturas;
  const listarDocumentosConErrores = vi.fn();
  const error = vi.fn();
  const navigate = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    localStorage.clear();
    listarDocumentosConErrores.mockReturnValue(of(docs));
    navigate.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: ItemFacturaService, useValue: { listarDocumentosConErrores } },
        { provide: NotificacionService, useValue: { error } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    TestBed.inject(SessionService).setUserLoggedIn(usuarioMock);
    fixture = TestBed.createComponent(AuditoriaFacturas);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('las fechas por defecto son del 1 de enero a hoy', () => {
    const hoy = new Date();
    const v = comp.form.getRawValue();
    expect(v.fechaIni).toEqual(new Date(hoy.getFullYear(), 0, 1));
    expect((v.fechaFin as Date).toDateString()).toBe(hoy.toDateString());
  });

  it('lista los documentos con errores con los parámetros exactos de v1', async () => {
    comp.form.patchValue({ fechaIni: new Date(2021, 0, 1), fechaFin: new Date(2021, 5, 30) });
    await comp.buscar();
    expect(listarDocumentosConErrores).toHaveBeenCalledWith(2, '2', '2021-01-01', '2021-06-30');
    expect(comp.documentos()).toEqual(docs);
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('F002');
    expect(texto).toContain('Factura');
    expect(texto).toContain('S/ 99.90');
    expect(texto).toContain('TRANSPORTE');
    expect(texto).toContain('20/01/2021');
  });

  it('no busca si falta una fecha', async () => {
    comp.form.controls.fechaFin.setValue(null);
    await comp.buscar();
    expect(listarDocumentosConErrores).not.toHaveBeenCalled();
    expect(comp.invalido('fechaFin')).toBe(true);
  });

  it('abre el documento en el registro con los parámetros de v1', async () => {
    await comp.buscar();
    comp.alAccion({ accion: 'consultar', fila: comp.filas()[0] });
    expect(navigate).toHaveBeenCalledWith(['/forms/facturacion/registro'], {
      queryParams: { tipoDoc: 1, serie: 'F002', secuencia: '00000005' },
    });
  });

  it('muestra errorMessage del backend y, si no llega, el genérico de v1', async () => {
    listarDocumentosConErrores.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: { codeMessage: 'E', errorMessage: 'Falla X' } })),
    );
    await comp.buscar();
    expect(error).toHaveBeenCalledWith('Error', 'Falla X');
    listarDocumentosConErrores.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    await comp.buscar();
    expect(error).toHaveBeenLastCalledWith('Error', MENSAJE_ERROR_GENERICO);
    expect(comp.documentos()).toEqual([]);
  });
});
