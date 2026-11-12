import { describe, expect, it } from 'vitest';
import { ajustarFechaAnulacionGuia, ajustarFechaEnvioGuia, fechaLocalDesdeApiGuia } from './fechas-guia';

const MIN = 60 * 1000;

/** Implementación literal de v1 (`basic-form.component.ts`) para comparar. */
function v1Envio(valor: Date | string | null): Date {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- réplica literal de v1 (`new Date(null)`)
  const fe = new Date(valor as any);
  fe.setTime(fe.getTime() + fe.getTimezoneOffset() * 60 * 1000);
  return fe;
}

describe('ajustarFechaEnvioGuia', () => {
  it('suma el desfase de zona horaria de la propia fecha (fórmula de v1)', () => {
    const local = new Date(2024, 0, 15);
    const r = ajustarFechaEnvioGuia(local);
    expect(r.getTime()).toBe(local.getTime() + local.getTimezoneOffset() * MIN);
  });

  it('medianoche local del datepicker: UTC del día + 2 veces el desfase (Lima: 10:00Z)', () => {
    const local = new Date(2024, 0, 15);
    const desfase = local.getTimezoneOffset() * MIN;
    expect(ajustarFechaEnvioGuia(local).getTime()).toBe(Date.UTC(2024, 0, 15) + 2 * desfase);
  });

  it('da el mismo JSON que v1 para Date, string ISO y null', () => {
    const casos: (Date | string | null)[] = [new Date(2023, 6, 31), '2024-03-10T00:00:00.000Z', '2024-12-31', null];
    for (const c of casos) {
      expect(JSON.stringify(ajustarFechaEnvioGuia(c))).toBe(JSON.stringify(v1Envio(c)));
    }
  });

  it('null equivale a new Date(null) de v1 (época Unix ajustada)', () => {
    const epoca = new Date(0);
    expect(ajustarFechaEnvioGuia(null).getTime()).toBe(epoca.getTimezoneOffset() * MIN);
  });

  it('no muta la fecha recibida', () => {
    const local = new Date(2024, 0, 15);
    const antes = local.getTime();
    ajustarFechaEnvioGuia(local);
    expect(local.getTime()).toBe(antes);
  });
});

describe('ajustarFechaAnulacionGuia', () => {
  it('con fecha ajusta igual que el alta', () => {
    const local = new Date(2024, 4, 2);
    expect(ajustarFechaAnulacionGuia(local).getTime()).toBe(ajustarFechaEnvioGuia(local).getTime());
  });

  it('sin fecha devuelve "ahora" sin ajuste', () => {
    const ahora = new Date(2024, 4, 2, 13, 45, 10);
    expect(ajustarFechaAnulacionGuia(null, ahora)).toBe(ahora);
  });
});

describe('fechaLocalDesdeApiGuia', () => {
  it('sin fecha devuelve null', () => {
    expect(fechaLocalDesdeApiGuia(null)).toBeNull();
    expect(fechaLocalDesdeApiGuia(undefined)).toBeNull();
    expect(fechaLocalDesdeApiGuia('')).toBeNull();
  });

  it('string del backend: new Date(valor) + desfase (calcularFechaHoraLocal de v1)', () => {
    const base = new Date('2024-01-15T00:00:00.000Z');
    const r = fechaLocalDesdeApiGuia('2024-01-15T00:00:00.000Z');
    expect(r?.getTime()).toBe(base.getTime() + base.getTimezoneOffset() * MIN);
  });

  it('una fecha UTC medianoche queda como ese mismo día a las 00:00 locales', () => {
    const r = fechaLocalDesdeApiGuia('2024-01-15T00:00:00.000Z');
    // Válido para zonas al oeste de UTC (Perú) y para UTC.
    if (new Date(2024, 0, 15).getTimezoneOffset() >= 0) {
      expect([r?.getFullYear(), r?.getMonth(), r?.getDate(), r?.getHours()]).toEqual([2024, 0, 15, 0]);
    }
  });

  it('acepta un Date (usa toString, como v1)', () => {
    const d = new Date(2024, 5, 1, 8, 30);
    const r = fechaLocalDesdeApiGuia(d);
    const esperado = new Date(d.toString());
    expect(r?.getTime()).toBe(esperado.getTime() + esperado.getTimezoneOffset() * MIN);
  });
});
