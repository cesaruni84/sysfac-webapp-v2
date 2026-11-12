import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter, type Params } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionService } from '../../../core/auth';
import type { Chofer, Empresa, Factoria, GuiaRemision, GuiaRemisionEnvio, Producto, UnidadMedida } from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import {
  BalanzaService,
  ChoferService,
  FactoriaService,
  GuiaRemisionService,
  ProductoService,
  UnidadMedidaService,
} from '../../../core/services';
import { ConfirmacionService } from '../../../shared/ui';
import { ESPERA_AVISO_MS, MENSAJE_GENERICO, RegistroGuia } from './registro-guia';

const empresa = { id: 5, razonSocial: 'EMP SAC', ruc: '20123456789', dirFiscal: 'AV. LIMA 1' } as Empresa;
const remitente: Factoria = { id: 3, refLarga2: 'PLANTA A', ruc: '20111111111', direccion: 'AV 1' };
const destinatario: Factoria = { id: 4, refLarga2: 'PLANTA B', ruc: '20222222222', direccion: 'AV 2' };
const producto: Producto = { id: 7, nombre: 'GLP' };
const toneladas: UnidadMedida = { id: 1, valor: 'TN', descripcion: 'TONELADAS' };
const kilos: UnidadMedida = { id: 2, valor: 'KG', descripcion: 'KILOGRAMOS' };
const chofer: Chofer = {
  id: 9,
  nombres: 'Juan',
  apellidos: 'Perez',
  dni: '1',
  certificado: 'C-1',
  licencia: 'L-1',
  vehiculo: { placaTracto: 'T-9', placaBombona: 'B-9' },
};

const guiaApi: GuiaRemision = {
  id: 55,
  serie: '00001',
  secuencia: '00000025',
  estado: 0,
  fechaRemision: '2024-01-15T00:00:00.000Z',
  fechaTraslado: '2024-01-15T00:00:00.000Z',
  fechaRecepcion: '2024-01-16T00:00:00.000Z',
  remitente: { id: 3, refLarga2: 'PLANTA A', cliente: { ruc: '201', direccion: 'DIR A' } },
  destinatario: { id: 4, refLarga2: 'PLANTA B', cliente: { ruc: '202', direccion: 'DIR B' } },
  guiaDetalle: [{ id: 66, producto, unidadMedida: kilos, cantidad: 10 }],
  totalCantidad: 10,
  placaTracto: 'T-1',
  placaBombona: 'B-1',
  chofer,
  ticketBalanza: '123',
  serieCliente: '00003',
  secuenciaCliente: '00000077',
  liquidacion: { id: 8 },
  tarifa: 12.5,
};

describe('RegistroGuia', () => {
  const guias = {
    obtenerGuiaRemisionxNroGuia: vi.fn(),
    obtenerGuiaRemisionxNroGuiaCliente: vi.fn(),
    buscaGuiaRemisionxNroGuia: vi.fn(),
    buscaGuiaRemisionxNroGuiaCliente: vi.fn(),
    registrarGuiaRemisionBD: vi.fn(),
    actualizarGuiaRemisionBD: vi.fn(),
    anularGuiaRemisionBD: vi.fn(),
  };
  const factorias = { listarComboFactorias: vi.fn() };
  const productos = { listarComboProductos: vi.fn() };
  const unidades = { listarComboUnidadesMedida: vi.fn() };
  const choferes = { listarComboChoferes: vi.fn() };
  const balanzas = { listarComboBalanzas: vi.fn() };
  const confirmar = vi.fn();
  const avisos = { exito: vi.fn(), error: vi.fn(), info: vi.fn(), advertencia: vi.fn() };
  const sesion = { getUserLoggedIn: vi.fn() };

  function crear(queryParams: Params = {}) {
    const paramMap = convertToParamMap(queryParams);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(paramMap), snapshot: { queryParamMap: paramMap } } },
        { provide: GuiaRemisionService, useValue: guias },
        { provide: FactoriaService, useValue: factorias },
        { provide: ProductoService, useValue: productos },
        { provide: UnidadMedidaService, useValue: unidades },
        { provide: ChoferService, useValue: choferes },
        { provide: BalanzaService, useValue: balanzas },
        { provide: ConfirmacionService, useValue: { confirmar } },
        { provide: NotificacionService, useValue: avisos },
        { provide: SessionService, useValue: sesion },
      ],
    });
    // Sin rutas registradas: las navegaciones de la pantalla se interceptan.
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegistroGuia);
    fixture.detectChanges();
    return fixture;
  }

  function llenar(c: RegistroGuia) {
    c.form.patchValue({
      nroSerie: '1',
      nroSecuencia: '25',
      nroSerieClie: '3',
      nroSequenClie: '77',
      remitenteSelected: remitente,
      destinatarioSelected: destinatario,
      productoSelected: producto,
      cantidad: 28.5,
      choferSelected: chofer,
      placaTracto: 'ABC',
      placaBombona: 'XYZ',
    });
    c.form.controls.fechaEmision.setValue(new Date(2024, 0, 15));
  }

  function enviado(fn: ReturnType<typeof vi.fn>): GuiaRemisionEnvio {
    return fn.mock.calls[0][0] as GuiaRemisionEnvio;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    factorias.listarComboFactorias.mockReturnValue(of([remitente, destinatario]));
    productos.listarComboProductos.mockReturnValue(of([producto]));
    unidades.listarComboUnidadesMedida.mockReturnValue(of([kilos, toneladas]));
    choferes.listarComboChoferes.mockReturnValue(of([chofer]));
    balanzas.listarComboBalanzas.mockReturnValue(of([]));
    guias.obtenerGuiaRemisionxNroGuia.mockReturnValue(of(guiaApi));
    guias.obtenerGuiaRemisionxNroGuiaCliente.mockReturnValue(of(guiaApi));
    guias.buscaGuiaRemisionxNroGuia.mockReturnValue(of({ codeMessage: 'GRT101', alertMessage: '' }));
    guias.buscaGuiaRemisionxNroGuiaCliente.mockReturnValue(of({ codeMessage: 'GRT101', alertMessage: '' }));
    guias.registrarGuiaRemisionBD.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Guía registrada' }));
    guias.actualizarGuiaRemisionBD.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Guía actualizada' }));
    guias.anularGuiaRemisionBD.mockReturnValue(of({ codeMessage: 'OK', alertMessage: 'Guía anulada' }));
    confirmar.mockResolvedValue(true);
    sesion.getUserLoggedIn.mockReturnValue({ codigo: 'admin', empresa });
  });

  afterEach(() => vi.useRealTimers());

  it('carga los catálogos como v1 y preselecciona TONELADAS', () => {
    const c = crear().componentInstance;
    expect(factorias.listarComboFactorias).toHaveBeenCalledWith('O');
    expect(factorias.listarComboFactorias).toHaveBeenCalledWith('D');
    expect(choferes.listarComboChoferes).toHaveBeenCalledWith(1);
    expect(c.form.controls.unidadMedidaSelected.value).toBe(toneladas);
    expect(c.form.controls.estadoSelected.value).toBe('0');
    expect(c.empresaTexto).toBe('EMP SAC - RUC 20123456789');
    expect(c.empresaDireccion).toBe('AV. LIMA 1');
    expect(guias.obtenerGuiaRemisionxNroGuia).not.toHaveBeenCalled();
  });

  it('con _serie y _secuencia carga la guía y pasa a edición', () => {
    const c = crear({ _serie: '00001', _secuencia: '00000025' }).componentInstance;
    expect(guias.obtenerGuiaRemisionxNroGuia).toHaveBeenCalledWith(5, '00001', '00000025');
    expect(c.edicion()).toBe(true);
    const v = c.form.getRawValue();
    expect(v.nroSerie).toBe('00001');
    expect(v.remitenteSelected).toBe(guiaApi.remitente);
    expect(v.unidadMedidaSelected).toBe(kilos);
    expect(v.cantidad).toBe(10);
    expect(v.nroTicketBal).toBe('123');
    expect(c.rucRemitente()).toBe('201');
    expect(c.dirDestinatario()).toBe('DIR B');
    expect(c.certificado()).toBe('C-1');
    // La carga no copia la emisión sobre la recepción.
    expect(v.fechaRecepcion?.getTime()).not.toBe(v.fechaEmision?.getTime());
  });

  it('la fecha de emisión se copia a inicio de traslado y recepción', () => {
    const c = crear().componentInstance;
    const f = new Date(2024, 2, 3);
    c.form.controls.fechaEmision.setValue(f);
    expect(c.form.controls.fechaIniTraslado.value).toBe(f);
    expect(c.form.controls.fechaRecepcion.value).toBe(f);
  });

  it('elegir remitente, destinatario y chofer completa los datos derivados', () => {
    const c = crear().componentInstance;
    c.seleccionarRemitente(remitente);
    c.seleccionarDestinatario(destinatario);
    c.seleccionarChofer(chofer);
    expect([c.rucRemitente(), c.dirRemitente(), c.rucDestinatario(), c.dirDestinatario()]).toEqual([
      '20111111111',
      'AV 1',
      '20222222222',
      'AV 2',
    ]);
    expect([c.certificado(), c.licencia()]).toEqual(['C-1', 'L-1']);
    expect([c.form.controls.placaTracto.value, c.form.controls.placaBombona.value]).toEqual(['T-9', 'B-9']);
  });

  it('formulario inválido: no envía y marca los errores', () => {
    const c = crear().componentInstance;
    c.grabar();
    expect(guias.registrarGuiaRemisionBD).not.toHaveBeenCalled();
    expect(c.invalido('nroSerie')).toBe(true);
  });

  it('alta: POST con el cuerpo de v1 y, tras el aviso, formulario nuevo', () => {
    vi.useFakeTimers();
    const c = crear().componentInstance;
    llenar(c);
    c.grabar();
    const g = enviado(guias.registrarGuiaRemisionBD);
    expect([g.serie, g.secuencia, g.serieCliente, g.secuenciaCliente]).toEqual(['00001', '00000025', '00003', '00000077']);
    expect(g.estado).toBe('0');
    expect(g.motivoTraslado).toBe(2);
    expect(g.totalCantidad).toBe(28.5);
    expect(g.guiaDetalle?.[0].unidadMedida).toBe(toneladas);
    expect(g.empresa).toBe(empresa);
    expect(g.usuarioRegistro).toBe('admin');
    expect('id' in JSON.parse(JSON.stringify(g))).toBe(false);
    expect(avisos.exito).toHaveBeenCalledWith('OK', 'Guía registrada');
    expect(c.form.controls.nroSerie.value).toBe('00001');
    expect(c.esperandoNueva()).toBe(true);

    vi.advanceTimersByTime(ESPERA_AVISO_MS);
    expect(c.form.controls.nroSerie.value).toBe('');
    expect(c.form.controls.unidadMedidaSelected.value).toBe(toneladas);
    expect(c.esperandoNueva()).toBe(false);
  });

  it('edición: PUT con id, tarifa y liquidación de la guía cargada', () => {
    const c = crear({ _serie: '00001', _secuencia: '00000025' }).componentInstance;
    c.grabar();
    expect(guias.registrarGuiaRemisionBD).not.toHaveBeenCalled();
    const g = enviado(guias.actualizarGuiaRemisionBD);
    expect(g.id).toBe(55);
    expect(g.tarifa).toBe(12.5);
    expect(g.liquidacion).toEqual({ id: 8 });
    expect(g.guiaDetalle?.[0].id).toBe(66);
    expect(avisos.exito).toHaveBeenCalledWith('OK', 'Guía actualizada');
  });

  it('error al grabar: muestra errorMessage o el mensaje genérico de v1', () => {
    const c = crear().componentInstance;
    llenar(c);
    guias.registrarGuiaRemisionBD.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { codeMessage: 'GRT1', errorMessage: 'Ya existe' } })),
    );
    c.grabar();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'Ya existe');
    expect(c.guardando()).toBe(false);

    guias.registrarGuiaRemisionBD.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: null })));
    c.grabar();
    expect(avisos.error).toHaveBeenLastCalledWith('Error', MENSAJE_GENERICO);
  });

  it('secuencia repetida (GRT102): avisa y la limpia al cerrarse el aviso', () => {
    vi.useFakeTimers();
    guias.buscaGuiaRemisionxNroGuia.mockReturnValue(of({ codeMessage: 'GRT102', alertMessage: 'La guía ya existe' }));
    const c = crear().componentInstance;
    c.form.patchValue({ nroSerie: '00001', nroSecuencia: '25' });
    c.alCambiarSecuencia();
    expect(guias.buscaGuiaRemisionxNroGuia).toHaveBeenCalledWith(5, '00001', '00000025');
    expect(avisos.advertencia).toHaveBeenCalledWith('Aviso', 'La guía ya existe');
    expect(c.form.controls.nroSecuencia.value).toBe('00000025');
    vi.advanceTimersByTime(ESPERA_AVISO_MS);
    expect(c.form.controls.nroSecuencia.value).toBe('');
  });

  it('guía del cliente repetida: solo avisa', () => {
    vi.useFakeTimers();
    guias.buscaGuiaRemisionxNroGuiaCliente.mockReturnValue(of({ codeMessage: 'GRT102', alertMessage: 'Existe' }));
    const c = crear().componentInstance;
    c.form.patchValue({ nroSerieClie: '00003', nroSequenClie: '77' });
    c.alCambiarSecuenciaCliente();
    expect(guias.buscaGuiaRemisionxNroGuiaCliente).toHaveBeenCalledWith(5, '00003', '00000077');
    expect(avisos.advertencia).toHaveBeenCalledWith('Aviso', 'Existe');
    vi.advanceTimersByTime(ESPERA_AVISO_MS);
    expect(c.form.controls.nroSequenClie.value).toBe('00000077');
  });

  it('consultar por guía propia y por guía del cliente completan con ceros', () => {
    const c = crear().componentInstance;
    c.form.patchValue({ nroSerie: '1', nroSecuencia: '25' });
    c.consultarGuia();
    expect(guias.obtenerGuiaRemisionxNroGuia).toHaveBeenCalledWith(5, '00001', '00000025');
    c.form.patchValue({ nroSerieClie: '3', nroSequenClie: '77' });
    c.consultarGuiaCliente();
    expect(guias.obtenerGuiaRemisionxNroGuiaCliente).toHaveBeenCalledWith(5, '00003', '00000077');
    expect(c.edicion()).toBe(true);
  });

  it('consulta sin resultado: avisa y no pasa a edición', () => {
    guias.obtenerGuiaRemisionxNroGuia.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { codeMessage: 'GRT3', errorMessage: 'No existe' } })),
    );
    const c = crear().componentInstance;
    c.form.patchValue({ nroSerie: '1', nroSecuencia: '25' });
    c.consultarGuia();
    expect(avisos.error).toHaveBeenCalledWith('Error', 'No existe');
    expect(c.edicion()).toBe(false);
  });

  it('anular: confirma, envía estado 1 y bloquea el formulario', async () => {
    const c = crear({ _serie: '00001', _secuencia: '00000025' }).componentInstance;
    await c.anular();
    expect(confirmar).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Confirma anular la guia de remisión:  00001 - 00000025 ?' }),
    );
    const g = enviado(guias.anularGuiaRemisionBD);
    expect(g.estado).toBe(1);
    expect(g.id).toBe(55);
    expect(c.anulada()).toBe(true);
    expect(c.bloqueado()).toBe(true);
    expect(c.form.disabled).toBe(true);
    expect(c.form.controls.estadoSelected.value).toBe('1');
    expect(avisos.exito).toHaveBeenCalledWith('OK', 'Guía anulada');
  });

  it('anular sin confirmar no envía nada; sin serie/secuencia no pregunta', async () => {
    confirmar.mockResolvedValue(false);
    const c = crear({ _serie: '00001', _secuencia: '00000025' }).componentInstance;
    await c.anular();
    expect(guias.anularGuiaRemisionBD).not.toHaveBeenCalled();

    c.nuevaGuia();
    confirmar.mockClear();
    await c.anular();
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('guía anulada cargada: deshabilita "Anular"', () => {
    guias.obtenerGuiaRemisionxNroGuia.mockReturnValue(of({ ...guiaApi, estado: 1 }));
    const c = crear({ _serie: '00001', _secuencia: '00000025' }).componentInstance;
    expect(c.anulada()).toBe(true);
    expect(c.form.controls.estadoSelected.value).toBe('1');
  });

  it('Nuevo limpia la URL de consulta; Regresar va a la consulta de guías', () => {
    const fixture = crear({ _serie: '00001', _secuencia: '00000025' });
    const router = TestBed.inject(Router);
    const nav = vi.mocked(router.navigate);
    fixture.componentInstance.nuevaGuia();
    expect(nav).toHaveBeenCalledWith(['/forms/basic']);
    expect(fixture.componentInstance.edicion()).toBe(false);
    fixture.componentInstance.regresar();
    expect(nav).toHaveBeenLastCalledWith(['/forms/paging']);
  });

  it('solo dígitos con longitud máxima', () => {
    const c = crear().componentInstance;
    const input = document.createElement('input');
    input.value = '12a.34567';
    c.filtrarDigitos('nroSerie', { target: input } as unknown as Event, 5);
    expect(c.form.controls.nroSerie.value).toBe('12345');
    expect(input.value).toBe('12345');
  });
});
