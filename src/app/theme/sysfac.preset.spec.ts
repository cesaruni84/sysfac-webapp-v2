import { SYSFAC_PRIMARY, SysfacPreset } from './sysfac.preset';

describe('SysfacPreset', () => {
  it('usa como primary la paleta egret-blue de v1 (base #247ba0)', () => {
    expect(SYSFAC_PRIMARY[500]).toBe('#247ba0');
    const semantic = SysfacPreset.semantic as { primary?: unknown } | undefined;
    expect(semantic?.primary).toEqual(SYSFAC_PRIMARY);
  });

  it('define los 11 tonos que espera PrimeNG (50 a 950)', () => {
    expect(Object.keys(SYSFAC_PRIMARY)).toEqual(
      ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
    );
  });
});
