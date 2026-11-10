import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { accionEditar, accionEliminar } from './acciones';
import { Tabla } from './tabla';
import { TablaCelda, TablaDetalle } from './tabla.directivas';
import type {
  AccionTabla,
  ColumnaTabla,
  EventoAccionTabla,
  EventoCargaTabla,
  EventoExportarTabla,
  FormatoExportacion,
  TotalesTabla,
} from './tabla.types';

interface Guia {
  id: number;
  serie: string;
  fecha: string;
  importe: number;
  estado: number;
  empresa: { razonSocial: string };
}

function guias(n: number): Guia[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    serie: `T${String(i + 1).padStart(3, '0')}`,
    fecha: `2021-03-${String((i % 28) + 1).padStart(2, '0')}`,
    importe: (i + 1) * 100.5,
    estado: i % 2,
    empresa: { razonSocial: i % 2 ? 'Beta SAC' : 'Alfa SAC' },
  }));
}

const COLUMNAS: ColumnaTabla<Guia>[] = [
  { campo: 'serie', titulo: 'Serie', filtrable: true },
  { campo: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
  { campo: 'empresa.razonSocial', titulo: 'Empresa' },
  { campo: 'importe', titulo: 'Importe', tipo: 'moneda', moneda: 'S/' },
  {
    campo: 'estado',
    titulo: 'Estado',
    tipo: 'tag',
    tag: (v) => (v === 1 ? { texto: 'Anulado', severidad: 'danger' } : { texto: 'Registrado', severidad: 'success' }),
  },
  { campo: 'id', id: 'item', titulo: 'Item', tipo: 'plantilla', ordenable: false },
];

@Component({
  imports: [Tabla, TablaCelda, TablaDetalle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-tabla
      [filas]="filas()"
      [columnas]="columnas"
      [acciones]="acciones"
      [modoSeleccion]="modo()"
      [(seleccion)]="seleccion"
      [formatosExportacion]="formatos"
      [retardoFiltro]="0"
      [cargando]="cargando()"
      [totales]="totales()"
      [lazy]="lazy()"
      [totalRegistros]="100"
      (accion)="acciones_.push($event)"
      (exportar)="exportaciones.push($event)"
      (cargar)="cargas.push($event)"
    >
      <button appTablaBarra type="button" data-testid="nuevo">Nuevo</button>
      <ng-template appTablaCelda="item" [tipar]="filas()" let-fila let-i="indice">
        <span class="item">{{ i + 1 }}-{{ fila.serie }}</span>
      </ng-template>
      @if (conDetalle()) {
        <ng-template appTablaDetalle [tipar]="filas()" let-guia>
          <div class="detalle">Detalle de {{ guia.serie }}</div>
        </ng-template>
      }
    </app-tabla>
  `,
})
class Anfitrion {
  readonly tabla = viewChild.required<Tabla<Guia>>(Tabla);
  readonly filas = signal<Guia[]>(guias(12));
  readonly columnas = COLUMNAS;
  readonly acciones: AccionTabla<Guia>[] = [
    accionEditar(),
    { ...accionEliminar(), visible: (g) => g.estado === 0 },
  ];
  readonly modo = signal<'simple' | 'multiple' | null>(null);
  readonly seleccion = signal<readonly Guia[]>([]);
  readonly formatos: FormatoExportacion[] = ['excel', 'pdf'];
  readonly cargando = signal(false);
  readonly totales = signal<TotalesTabla | null>(null);
  readonly lazy = signal(false);
  readonly conDetalle = signal(false);
  readonly acciones_: EventoAccionTabla<Guia>[] = [];
  readonly exportaciones: EventoExportarTabla<Guia>[] = [];
  readonly cargas: EventoCargaTabla[] = [];
}

describe('Tabla', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let anfitrion: Anfitrion;
  let el: HTMLElement;

  const filasCuerpo = () => Array.from(el.querySelectorAll<HTMLTableRowElement>('tbody tr'));
  const textoCelda = (fila: number, col: number) =>
    filasCuerpo()[fila].querySelectorAll('td')[col].textContent?.trim();
  /** Columnas de datos empiezan tras la de acciones (posición inicio). */
  const C = { serie: 1, fecha: 2, empresa: 3, importe: 4, estado: 5, item: 6 };

  async function pintar() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function esperarFiltro() {
    await new Promise((r) => setTimeout(r, 20));
    await pintar();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Anfitrion);
    anfitrion = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    await pintar();
  });

  it('pinta cabeceras, filas con valores anidados, fecha, moneda, tag y plantilla', () => {
    const cabeceras = Array.from(el.querySelectorAll('thead tr:first-child th')).map((th) =>
      th.textContent?.trim(),
    );
    expect(cabeceras).toEqual(['Acciones', 'Serie', 'Fecha', 'Empresa', 'Importe', 'Estado', 'Item']);
    expect(textoCelda(0, C.serie)).toBe('T001');
    expect(textoCelda(0, C.fecha)).toBe('01/03/2021');
    expect(textoCelda(0, C.empresa)).toBe('Alfa SAC');
    expect(textoCelda(0, C.importe)).toBe('S/ 100.50');
    expect(filasCuerpo()[0].querySelectorAll('td')[C.importe].className).toContain('text-right');
    expect(filasCuerpo()[1].querySelector('p-tag')?.textContent?.trim()).toBe('Anulado');
    expect(textoCelda(1, C.item)).toBe('2-T002');
    expect(el.querySelector('[data-testid="nuevo"]')).not.toBeNull();
  });

  it('pagina en cliente con 10 filas por página (como v1)', async () => {
    expect(filasCuerpo()).toHaveLength(10);
    expect(el.textContent).toContain('1 - 10 de 12');
    el.querySelector<HTMLButtonElement>('.p-paginator-next')?.click();
    await pintar();
    expect(filasCuerpo()).toHaveLength(2);
    expect(textoCelda(0, C.serie)).toBe('T011');
    expect(textoCelda(0, C.item)).toBe('11-T011');
  });

  it('ordena al pulsar la cabecera (asc y desc) sin mutar las filas de entrada', async () => {
    const original = anfitrion.filas();
    const cabecera = () => el.querySelectorAll<HTMLElement>('thead tr:first-child th')[C.importe];
    cabecera().click();
    await pintar();
    expect(textoCelda(0, C.serie)).toBe('T001');
    cabecera().click();
    await pintar();
    expect(textoCelda(0, C.serie)).toBe('T012');
    expect(anfitrion.filas()).toBe(original);
    expect(original[0].serie).toBe('T001');
  });

  it('las columnas con ordenable=false no son ordenables', () => {
    const th = el.querySelectorAll<HTMLElement>('thead tr:first-child th')[C.item];
    expect(th.querySelector('p-sorticon')).toBeNull();
  });

  it('filtro global sobre valores (incluidos anidados)', async () => {
    const input = el.querySelector<HTMLInputElement>('[data-testid="buscador-tabla"]') as HTMLInputElement;
    input.value = 'beta';
    input.dispatchEvent(new Event('input'));
    await esperarFiltro();
    expect(filasCuerpo()).toHaveLength(6);
    expect(filasCuerpo().every((f) => f.textContent?.includes('Beta SAC'))).toBe(true);
  });

  it('filtro por columna', async () => {
    const input = el.querySelector<HTMLInputElement>('input[aria-label="Filtrar Serie"]') as HTMLInputElement;
    input.value = 'T01';
    input.dispatchEvent(new Event('input'));
    await esperarFiltro();
    expect(filasCuerpo().map((_, i) => textoCelda(i, C.serie))).toEqual(['T010', 'T011', 'T012']);
  });

  it('exportar emite el formato y las filas filtradas y ordenadas de todas las páginas', async () => {
    const input = el.querySelector<HTMLInputElement>('[data-testid="buscador-tabla"]') as HTMLInputElement;
    input.value = 'alfa';
    input.dispatchEvent(new Event('input'));
    await esperarFiltro();
    el.querySelectorAll<HTMLElement>('thead tr:first-child th')[C.importe].click();
    await pintar();
    el.querySelectorAll<HTMLElement>('thead tr:first-child th')[C.importe].click();
    await pintar();

    el.querySelector<HTMLButtonElement>('[data-testid="exportar-excel"] button')?.click();
    expect(anfitrion.exportaciones).toHaveLength(1);
    const { formato, filas } = anfitrion.exportaciones[0];
    expect(formato).toBe('excel');
    expect(filas.map((g) => g.serie)).toEqual(['T011', 'T009', 'T007', 'T005', 'T003', 'T001']);

    el.querySelector<HTMLButtonElement>('[data-testid="exportar-pdf"] button')?.click();
    expect(anfitrion.exportaciones[1].formato).toBe('pdf');
  });

  it('sin filtros exporta todas las filas (no solo la página)', () => {
    el.querySelector<HTMLButtonElement>('[data-testid="exportar-excel"] button')?.click();
    expect(anfitrion.exportaciones[0].filas).toHaveLength(12);
  });

  it('acciones por fila emiten (accion) y respetan visible(fila)', () => {
    const botones = (i: number) => filasCuerpo()[i].querySelectorAll('[data-accion]');
    expect(botones(0)).toHaveLength(2);
    expect(botones(1)).toHaveLength(1);
    filasCuerpo()[0].querySelector<HTMLButtonElement>('[data-accion="eliminar"] button')?.click();
    filasCuerpo()[1].querySelector<HTMLButtonElement>('[data-accion="editar"] button')?.click();
    expect(anfitrion.acciones_.map((a) => [a.accion, a.fila.serie])).toEqual([
      ['eliminar', 'T001'],
      ['editar', 'T002'],
    ]);
  });

  it('selección múltiple con checkboxes actualiza el model', async () => {
    anfitrion.modo.set('multiple');
    await pintar();
    const checks = () => filasCuerpo().map((f) => f.querySelector<HTMLElement>('p-tablecheckbox input, p-tableCheckbox input'));
    checks()[0]?.click();
    await pintar();
    checks()[2]?.click();
    await pintar();
    expect(anfitrion.seleccion().map((g) => g.serie)).toEqual(['T001', 'T003']);
  });

  it('selección simple con clic en la fila', async () => {
    anfitrion.modo.set('simple');
    await pintar();
    filasCuerpo()[3].querySelectorAll('td')[C.serie].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await pintar();
    expect(anfitrion.seleccion().map((g) => g.serie)).toEqual(['T004']);
    filasCuerpo()[4].querySelectorAll('td')[C.serie].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await pintar();
    expect(anfitrion.seleccion().map((g) => g.serie)).toEqual(['T005']);
  });

  it('detalle expandible con plantilla tipada', async () => {
    anfitrion.conDetalle.set(true);
    await pintar();
    expect(el.querySelector('.detalle')).toBeNull();
    filasCuerpo()[1].querySelector<HTMLButtonElement>('button[aria-label="Ver detalle"]')?.click();
    await pintar();
    expect(el.querySelector('[data-testid="fila-detalle"]')?.textContent?.trim()).toBe('Detalle de T002');
    expect(el.querySelector('[data-testid="fila-detalle"] td')?.getAttribute('colspan')).toBe('8');
  });

  it('estado vacío y cargando', async () => {
    anfitrion.filas.set([]);
    await pintar();
    expect(el.querySelector('tbody')?.textContent).toContain('No se encontraron registros.');
    anfitrion.cargando.set(true);
    await pintar();
    expect(el.querySelector('.p-datatable-mask')).not.toBeNull();
    expect(el.querySelector<HTMLButtonElement>('[data-testid="exportar-excel"] button')?.disabled).toBe(true);
  });

  it('fila de totales con valores de la pantalla formateados por columna', async () => {
    anfitrion.totales.set({ importe: 1234.5, serie: '12 guías' });
    await pintar();
    const celdas = Array.from(el.querySelectorAll('[data-testid="fila-totales"] td')).map((td) =>
      td.textContent?.trim(),
    );
    expect(celdas).toEqual(['Totales', '12 guías', '', '', 'S/ 1,234.50', '', '']);
  });

  it('limpiarFiltros quita buscador y filtros', async () => {
    const input = el.querySelector<HTMLInputElement>('[data-testid="buscador-tabla"]') as HTMLInputElement;
    input.value = 'beta';
    input.dispatchEvent(new Event('input'));
    await esperarFiltro();
    anfitrion.tabla().limpiarFiltros();
    await pintar();
    expect(input.value).toBe('');
    expect(anfitrion.tabla().filasVisibles()).toHaveLength(12);
  });
});

describe('Tabla en modo lazy', () => {
  it('emite (cargar) al iniciar y al cambiar de página, con el total del servidor', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    const anfitrion = fixture.componentInstance;
    anfitrion.lazy.set(true);
    anfitrion.filas.set(guias(10));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(anfitrion.cargas[0]).toEqual({
      primero: 0,
      filas: 10,
      ordenCampo: undefined,
      orden: undefined,
      busqueda: '',
      filtros: {},
    });
    expect(el.textContent).toContain('1 - 10 de 100');

    el.querySelector<HTMLButtonElement>('.p-paginator-next')?.click();
    fixture.detectChanges();
    expect(anfitrion.cargas.at(-1)).toMatchObject({ primero: 10, filas: 10 });

    el.querySelectorAll<HTMLElement>('thead tr:first-child th')[4].click();
    fixture.detectChanges();
    expect(anfitrion.cargas.at(-1)).toMatchObject({ ordenCampo: 'importe', orden: 1 });

    const filtro = el.querySelector<HTMLInputElement>('input[aria-label="Filtrar Serie"]') as HTMLInputElement;
    filtro.value = 'T0';
    filtro.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 20));
    expect(anfitrion.cargas.at(-1)).toMatchObject({ primero: 0, filtros: { serie: 'T0' } });
  });
});
