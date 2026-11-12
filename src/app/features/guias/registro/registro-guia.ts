import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { SessionService } from '../../../core/auth';
import { CargaGlobalService } from '../../../core/carga';
import {
  CODIGO_GUIA_EXISTENTE,
  cargarGuiaEnFormulario,
  construirGuiaAnulacion,
  construirGuiaRegistro,
  datosDeChofer,
  esConsultaPorUrl,
  type ContextoGuia,
  type DatosFormularioGuia,
  type GuiaCargada,
} from '../../../core/domain/guias';
import {
  EstadoGuia,
  type Balanza,
  type Chofer,
  type ErrorResponse,
  type Factoria,
  type GuiaRemision,
  type InfoResponse,
  type Producto,
  type UnidadMedida,
} from '../../../core/models';
import { NotificacionService } from '../../../core/notifications';
import {
  BalanzaService,
  ChoferService,
  FactoriaService,
  GuiaRemisionService,
  ProductoService,
  UnidadMedidaService,
} from '../../../core/services';
import { completarSecuencia, completarSerie, digitos, fecha, soloDigitos } from '../../../core/validators';
import { ConfirmacionService } from '../../../shared/ui';

/** Mensaje de `handleError` de v1 cuando el backend no envía `errorMessage`. */
export const MENSAJE_GENERICO = 'Error de comunicación con los servicios. Intenta nuevamente.';
/** Duración del snackbar de v1 (ms): tras ella v1 limpia la secuencia repetida o abre una guía nueva. */
export const ESPERA_AVISO_MS = 5000;
/** Unidad de medida por defecto en una guía nueva (v1). */
export const UNIDAD_POR_DEFECTO = 'TONELADAS';

const PATRON_NUMERO = '^[0-9.,]+$';

type CampoNumero = 'nroSerie' | 'nroSecuencia' | 'nroSerieClie' | 'nroSequenClie';

interface OpcionEstado {
  valor: string;
  etiqueta: string;
}

/** Datos de la guía cargada que no están en el formulario (`valorIdGuia_`, `tarifaGuia`... de v1). */
type ContextoCargado = Omit<ContextoGuia, 'codigoUsuario' | 'empresa'>;

function crearFormulario() {
  return new FormGroup({
    nroSerie: new FormControl('', { nonNullable: true, validators: [digitos, Validators.required] }),
    nroSecuencia: new FormControl('', { nonNullable: true, validators: [digitos, Validators.required] }),
    estadoSelected: new FormControl('0', { nonNullable: true, validators: Validators.required }),
    nroSerieClie: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(1), Validators.maxLength(5), Validators.required, digitos],
    }),
    nroSequenClie: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(1), Validators.maxLength(8), Validators.required, digitos],
    }),
    fechaEmision: new FormControl<Date | null>(null, [Validators.required, fecha]),
    // v1: control deshabilitado (no cuenta en la validación) que se llena desde la fecha de emisión;
    // el calendario sí permitía cambiarlo.
    fechaIniTraslado: new FormControl<Date | null>(null),
    remitenteSelected: new FormControl<Factoria | null>(null, Validators.required),
    destinatarioSelected: new FormControl<Factoria | null>(null, Validators.required),
    productoSelected: new FormControl<Producto | null>(null, Validators.required),
    cantidad: new FormControl<number | null>(null, [Validators.required, Validators.pattern(PATRON_NUMERO)]),
    unidadMedidaSelected: new FormControl<UnidadMedida | null>(null, Validators.required),
    balanzaSelected: new FormControl<Balanza | null>(null),
    nroTicketBal: new FormControl<string | null>(null, [Validators.minLength(1), Validators.maxLength(30)]),
    fechaRecepcion: new FormControl<Date | null>(null, [Validators.required, fecha]),
    choferSelected: new FormControl<Chofer | null>(null, Validators.required),
    placaTracto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(1), Validators.maxLength(30), Validators.required],
    }),
    placaBombona: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(1), Validators.maxLength(30), Validators.required],
    }),
  });
}

export type FormularioGuia = ReturnType<typeof crearFormulario>;

/**
 * Registro, consulta, edición y anulación de guías de remisión (/forms/basic).
 * Port de `basic-form` de v1. Las reglas (armado del JSON, fechas, carga de la guía) están en
 * `core/domain/guias`; el componente solo orquesta formulario, catálogos y llamadas.
 *
 * Entrada desde la consulta (4.9): queryParams `_serie` y `_secuencia`.
 */
@Component({
  selector: 'app-registro-guia',
  imports: [ReactiveFormsModule, ButtonModule, DatePickerModule, InputTextModule, MessageModule, SelectModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro-guia.html',
})
export class RegistroGuia implements OnInit {
  private readonly guiaService = inject(GuiaRemisionService);
  private readonly factoriaService = inject(FactoriaService);
  private readonly productoService = inject(ProductoService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  private readonly choferService = inject(ChoferService);
  private readonly balanzaService = inject(BalanzaService);
  private readonly sesion = inject(SessionService);
  private readonly avisos = inject(NotificacionService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly carga = inject(CargaGlobalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly form: FormularioGuia = crearFormulario();

  readonly estados: OpcionEstado[] = [
    { valor: '0', etiqueta: 'Registrado' },
    { valor: '1', etiqueta: 'Anulado' },
  ];

  // Cabecera (empresa de la sesión, solo lectura).
  readonly empresaTexto: string;
  readonly empresaDireccion: string;

  // Catálogos.
  readonly factoriasOrigen = signal<Factoria[]>([]);
  readonly factoriasDestino = signal<Factoria[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly unidadesMedida = signal<UnidadMedida[]>([]);
  readonly choferes = signal<Chofer[]>([]);
  readonly balanzas = signal<Balanza[]>([]);

  // Campos derivados de los combos (solo lectura en v1).
  readonly rucRemitente = signal('');
  readonly dirRemitente = signal('');
  readonly rucDestinatario = signal('');
  readonly dirDestinatario = signal('');
  readonly certificado = signal('');
  readonly licencia = signal('');

  /** `true` cuando hay una guía cargada: Grabar hace PUT en vez de POST. */
  readonly edicion = signal(false);
  /** Deshabilita "Anular" (guía anulada cargada o recién anulada). */
  readonly anulada = signal(false);
  /** Formulario bloqueado tras anular (v1 `basicForm.disable()`). */
  readonly bloqueado = signal(false);
  readonly guardando = signal(false);
  /** Alta exitosa: se espera el cierre del aviso para abrir una guía nueva (no se puede volver a grabar). */
  readonly esperandoNueva = signal(false);

  private contexto: ContextoCargado = {};
  private readonly temporizadores = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    const empresa = this.sesion.getUserLoggedIn()?.empresa;
    this.empresaTexto = empresa ? `${empresa.razonSocial} - RUC ${empresa.ruc}` : '';
    this.empresaDireccion = empresa?.dirFiscal ?? '';
    this.destroyRef.onDestroy(() => this.limpiarTemporizadores());
  }

  ngOnInit(): void {
    this.cargarCombos();

    // v1 `onChangeFechaEmision`: la fecha de emisión copia su valor a inicio de traslado y recepción.
    this.form.controls.fechaEmision.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((valor) => {
      this.form.patchValue({ fechaIniTraslado: valor, fechaRecepcion: valor });
    });

    // v1 `validarGrabarActualizar`: con `_serie` y `_secuencia` en la URL se consulta la guía.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.reiniciar();
      const serie = params.get('_serie');
      const secuencia = params.get('_secuencia');
      if (esConsultaPorUrl(serie, secuencia)) {
        this.recuperarGuia(this.guiaService.obtenerGuiaRemisionxNroGuia(this.idEmpresa(), serie ?? '', secuencia ?? ''));
      }
    });
  }

  // ---------------------------------------------------------------- catálogos

  private cargarCombos(): void {
    // v1 pide las factorías dos veces ('O' y 'D'); el servicio ignora el tipo, pero se conservan las dos llamadas.
    this.factoriaService.listarComboFactorias('O').subscribe({
      next: (data) => this.factoriasOrigen.set(data),
      error: (err: unknown) => this.avisarError(err),
    });
    this.factoriaService.listarComboFactorias('D').subscribe({
      next: (data) => this.factoriasDestino.set(data),
      error: (err: unknown) => this.avisarError(err),
    });
    this.productoService.listarComboProductos().subscribe({
      next: (data) => this.productos.set(data),
      error: (err: unknown) => this.avisarError(err),
    });
    this.unidadMedidaService.listarComboUnidadesMedida().subscribe({
      next: (data) => {
        this.unidadesMedida.set(data);
        this.unidadPorDefecto();
      },
      error: (err: unknown) => this.avisarError(err),
    });
    this.choferService.listarComboChoferes(1).subscribe({
      next: (data) => this.choferes.set(data),
      error: (err: unknown) => this.avisarError(err),
    });
    this.balanzaService.listarComboBalanzas().subscribe({
      next: (data) => this.balanzas.set(data),
      error: (err: unknown) => this.avisarError(err),
    });
  }

  /** v1 preselecciona TONELADAS. Aquí solo si la unidad está vacía (no pisa la de una guía ya cargada). */
  private unidadPorDefecto(): void {
    const control = this.form.controls.unidadMedidaSelected;
    if (control.value) return;
    const toneladas = this.unidadesMedida().find((u) => u.descripcion === UNIDAD_POR_DEFECTO);
    if (toneladas) control.setValue(toneladas);
  }

  seleccionarRemitente(factoria: Factoria | null): void {
    this.rucRemitente.set(factoria?.ruc ?? '');
    this.dirRemitente.set(factoria?.direccion ?? '');
  }

  seleccionarDestinatario(factoria: Factoria | null): void {
    this.rucDestinatario.set(factoria?.ruc ?? '');
    this.dirDestinatario.set(factoria?.direccion ?? '');
  }

  seleccionarChofer(chofer: Chofer | null): void {
    if (!chofer) return;
    const datos = datosDeChofer(chofer);
    this.certificado.set(datos.certificado);
    this.licencia.set(datos.licencia);
    if (datos.placaTracto !== undefined) this.form.controls.placaTracto.setValue(datos.placaTracto);
    if (datos.placaBombona !== undefined) this.form.controls.placaBombona.setValue(datos.placaBombona);
  }

  // ------------------------------------------------- serie / secuencia (guía propia y del cliente)

  /** Solo dígitos y longitud máxima, al teclear y al pegar (`validaDigitos` + `maxlength` de v1). */
  filtrarDigitos(nombre: CampoNumero, evento: Event, maximo: number): void {
    const el = evento.target as HTMLInputElement;
    const limpio = soloDigitos(el.value).slice(0, maximo);
    if (limpio !== el.value) el.value = limpio;
    this.form.controls[nombre].setValue(limpio);
  }

  /** `completarZerosNroSerie` / `completarZerosNroSerieCli` de v1 (evento change). */
  alCambiarSerie(nombre: 'nroSerie' | 'nroSerieClie'): void {
    const control = this.form.controls[nombre];
    if (control.value) control.setValue(completarSerie(control.value));
  }

  /** `completarZerosNroSecuencia` de v1: completa y avisa si la guía ya existe (GRT102). */
  alCambiarSecuencia(): void {
    const { nroSerie, nroSecuencia } = this.form.controls;
    if (!nroSecuencia.value) return;
    nroSecuencia.setValue(completarSecuencia(nroSecuencia.value));
    this.validarExistencia(
      this.guiaService.buscaGuiaRemisionxNroGuia(this.idEmpresa(), nroSerie.value, nroSecuencia.value),
      true,
    );
  }

  /** `completarZerosNroSecuenciaCli` de v1: completa y avisa si la guía del cliente ya existe. */
  alCambiarSecuenciaCliente(): void {
    const { nroSerieClie, nroSequenClie } = this.form.controls;
    if (!nroSequenClie.value) return;
    nroSequenClie.setValue(completarSecuencia(nroSequenClie.value));
    this.validarExistencia(
      this.guiaService.buscaGuiaRemisionxNroGuiaCliente(this.idEmpresa(), nroSerieClie.value, nroSequenClie.value),
      false,
    );
  }

  /**
   * `validaSiExisteGuiaRemision(Cliente)` de v1: con GRT102 muestra el aviso del backend; en la guía
   * propia, al cerrarse el aviso (5 s) limpia la secuencia.
   */
  private validarExistencia(consulta: Observable<InfoResponse>, limpiarSecuencia: boolean): void {
    const { nroSerie, nroSecuencia, nroSerieClie, nroSequenClie } = this.form.controls;
    const [serie, secuencia] = limpiarSecuencia ? [nroSerie, nroSecuencia] : [nroSerieClie, nroSequenClie];
    if (!serie.value || !secuencia.value) return;
    consulta.subscribe({
      next: (info) => {
        if (info?.codeMessage !== CODIGO_GUIA_EXISTENTE) return;
        this.avisos.advertencia('Aviso', info.alertMessage);
        if (limpiarSecuencia) this.programar(() => nroSecuencia.setValue(''));
      },
      error: (err: unknown) => this.avisarError(err),
    });
  }

  /** Botón de búsqueda de la guía propia (`consultarGuia` de v1). */
  consultarGuia(): void {
    const { nroSerie, nroSecuencia } = this.form.controls;
    if (!nroSerie.value || !nroSecuencia.value) return;
    nroSerie.setValue(completarSerie(nroSerie.value));
    nroSecuencia.setValue(completarSecuencia(nroSecuencia.value));
    this.recuperarGuia(this.guiaService.obtenerGuiaRemisionxNroGuia(this.idEmpresa(), nroSerie.value, nroSecuencia.value));
  }

  /** Botón de búsqueda por guía del cliente (`consultarGuiaCliente` de v1). */
  consultarGuiaCliente(): void {
    const { nroSerieClie, nroSequenClie } = this.form.controls;
    if (!nroSerieClie.value || !nroSequenClie.value) return;
    nroSerieClie.setValue(completarSerie(nroSerieClie.value));
    nroSequenClie.setValue(completarSecuencia(nroSequenClie.value));
    this.recuperarGuia(
      this.guiaService.obtenerGuiaRemisionxNroGuiaCliente(this.idEmpresa(), nroSerieClie.value, nroSequenClie.value),
    );
  }

  private recuperarGuia(consulta: Observable<GuiaRemision>): void {
    consulta.subscribe({
      next: (guia) => {
        this.aplicarGuia(cargarGuiaEnFormulario(guia));
        this.edicion.set(true);
      },
      error: (err: unknown) => this.avisarError(err),
    });
  }

  /** `parsearDatosGuiaRemision` de v1: los bloques que la guía no trae conservan su valor. */
  private aplicarGuia(g: GuiaCargada): void {
    const f = this.form.controls;
    this.contexto = {
      idGuia: g.idGuia,
      idGuiaDetalle: g.detalle ? g.detalle.id : this.contexto.idGuiaDetalle,
      liquidacion: g.liquidacion,
      documento: g.documento,
      tarifa: g.tarifa,
    };
    // Sin emitir: cargar la emisión no debe pisar traslado y recepción.
    f.fechaEmision.setValue(g.fechaEmision, { emitEvent: false });
    this.form.patchValue({
      estadoSelected: g.estado,
      fechaIniTraslado: g.fechaIniTraslado,
      fechaRecepcion: g.fechaRecepcion,
      nroSerie: g.serie,
      nroSecuencia: g.secuencia,
      cantidad: g.cantidad,
      placaTracto: g.placaTracto,
      placaBombona: g.placaBombona,
      nroTicketBal: g.ticketBalanza,
      nroSerieClie: g.serieCliente,
      nroSequenClie: g.secuenciaCliente,
    });
    if (g.remitente) {
      f.remitenteSelected.setValue(g.remitente.factoria);
      this.rucRemitente.set(g.remitente.ruc);
      this.dirRemitente.set(g.remitente.direccion);
    }
    if (g.destinatario) {
      f.destinatarioSelected.setValue(g.destinatario.factoria);
      this.rucDestinatario.set(g.destinatario.ruc);
      this.dirDestinatario.set(g.destinatario.direccion);
    }
    if (g.detalle) {
      f.productoSelected.setValue(g.detalle.producto);
      f.unidadMedidaSelected.setValue(g.detalle.unidadMedida);
    }
    if (g.chofer) {
      f.choferSelected.setValue(g.chofer.chofer);
      this.certificado.set(g.chofer.certificado);
      this.licencia.set(g.chofer.licencia);
    }
    if (g.balanza) f.balanzaSelected.setValue(g.balanza);
    this.anulada.set(g.anulada);
  }

  // ---------------------------------------------------------------- acciones

  /** Botón "Grabar" (`grabarGuiaRemision` de v1): POST si es nueva, PUT si hay una guía cargada. */
  grabar(): void {
    if (this.guardando() || this.esperandoNueva() || this.bloqueado()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const usuario = this.sesion.getUserLoggedIn();
    if (!usuario) return;

    const edicion = this.edicion();
    const guia = construirGuiaRegistro(
      this.datosFormulario(),
      { ...this.contexto, codigoUsuario: usuario.codigo, empresa: usuario.empresa },
      edicion,
    );
    // v1 deja en pantalla los números completados con ceros.
    this.form.patchValue({
      nroSerie: guia.serie,
      nroSecuencia: guia.secuencia,
      nroSerieClie: guia.serieCliente,
      nroSequenClie: guia.secuenciaCliente,
    });

    const peticion = edicion ? this.guiaService.actualizarGuiaRemisionBD(guia) : this.guiaService.registrarGuiaRemisionBD(guia);
    this.guardando.set(true);
    this.carga.abrir('Grabando');
    peticion
      .pipe(
        finalize(() => {
          this.carga.cerrar();
          this.guardando.set(false);
        }),
      )
      .subscribe({
        next: (info) => {
          this.avisos.exito('OK', info?.alertMessage);
          // v1: tras un alta, al cerrarse el aviso abre una guía nueva.
          if (!edicion) {
            this.esperandoNueva.set(true);
            this.programar(() => this.nuevaGuia());
          }
        },
        error: (err: unknown) => this.avisarError(err),
      });
  }

  /** Botón "Anular" (`anularGuiaRemision` de v1). */
  async anular(): Promise<void> {
    const { nroSerie, nroSecuencia } = this.form.controls;
    const serie = nroSerie.value;
    const secuencia = nroSecuencia.value;
    const usuario = this.sesion.getUserLoggedIn();
    if (!serie || !secuencia || !usuario) return;

    // Como v1, el cuerpo se arma antes de confirmar.
    const guia = construirGuiaAnulacion(this.datosFormulario(), {
      ...this.contexto,
      codigoUsuario: usuario.codigo,
      empresa: usuario.empresa,
    });
    const ok = await this.confirmacion.confirmar({
      mensaje: `Confirma anular la guia de remisión:  ${serie} - ${secuencia} ?`,
      peligro: true,
    });
    if (!ok) return;

    this.carga.abrir('Anulando');
    this.guiaService
      .anularGuiaRemisionBD(guia)
      .pipe(finalize(() => this.carga.cerrar()))
      .subscribe({
        next: (info) => {
          this.form.controls.estadoSelected.setValue(`${EstadoGuia.ANULADO}`);
          this.anulada.set(true);
          this.bloqueado.set(true);
          this.form.disable({ emitEvent: false });
          this.avisos.exito('OK', info?.alertMessage);
        },
        error: (err: unknown) => this.avisarError(err),
      });
  }

  /** Botón "Regresar": vuelve a la consulta de guías. */
  regresar(): void {
    void this.router.navigate(['/forms/paging']);
  }

  /** Botón "Nuevo": formulario vacío (y sin los parámetros de consulta en la URL). */
  nuevaGuia(): void {
    this.reiniciar();
    const params = this.route.snapshot.queryParamMap;
    if (params.has('_serie') || params.has('_secuencia')) {
      void this.router.navigate(['/forms/basic']);
    }
  }

  // ---------------------------------------------------------------- utilidades

  invalido(nombre: keyof FormularioGuia['controls']): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Error de la pantalla: `errorMessage` del backend o el mensaje genérico de v1. */
  private avisarError(err: unknown): void {
    const cuerpo = err instanceof HttpErrorResponse ? (err.error as Partial<ErrorResponse> | null) : null;
    this.avisos.error('Error', cuerpo?.errorMessage || MENSAJE_GENERICO);
  }

  private datosFormulario(): DatosFormularioGuia {
    const v = this.form.getRawValue();
    return {
      serie: v.nroSerie,
      secuencia: v.nroSecuencia,
      estado: v.estadoSelected,
      serieCliente: v.nroSerieClie,
      secuenciaCliente: v.nroSequenClie,
      fechaEmision: v.fechaEmision,
      fechaIniTraslado: v.fechaIniTraslado,
      fechaRecepcion: v.fechaRecepcion,
      remitente: v.remitenteSelected,
      destinatario: v.destinatarioSelected,
      producto: v.productoSelected,
      cantidad: v.cantidad,
      unidadMedida: v.unidadMedidaSelected,
      balanza: v.balanzaSelected,
      ticketBalanza: v.nroTicketBal,
      chofer: v.choferSelected,
      placaTracto: v.placaTracto,
      placaBombona: v.placaBombona,
    };
  }

  private reiniciar(): void {
    this.limpiarTemporizadores();
    this.form.enable({ emitEvent: false });
    this.form.reset(undefined, { emitEvent: false });
    this.contexto = {};
    for (const s of [this.rucRemitente, this.dirRemitente, this.rucDestinatario, this.dirDestinatario, this.certificado, this.licencia]) {
      s.set('');
    }
    this.edicion.set(false);
    this.anulada.set(false);
    this.bloqueado.set(false);
    this.guardando.set(false);
    this.esperandoNueva.set(false);
    this.unidadPorDefecto();
  }

  private idEmpresa(): number {
    return this.sesion.getUserLoggedIn()?.empresa?.id ?? 0;
  }

  private programar(accion: () => void): void {
    const t = setTimeout(() => {
      this.temporizadores.delete(t);
      accion();
    }, ESPERA_AVISO_MS);
    this.temporizadores.add(t);
  }

  private limpiarTemporizadores(): void {
    this.temporizadores.forEach((t) => clearTimeout(t));
    this.temporizadores.clear();
  }
}
