import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it } from 'vitest';

import { LayoutAuth } from './auth-layout';

@Component({ template: '<p id="hija">Hija</p>' })
class Hija {}

describe('LayoutAuth', () => {
  it('muestra la marca, el pie y renderiza la ruta hija en el router-outlet', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: LayoutAuth, children: [{ path: 'x', component: Hija }] },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/x');
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="marca"]')?.textContent).toContain('SYSFAC');
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('footer')).not.toBeNull();
    expect(el.querySelector('#hija')).not.toBeNull();
    expect(el.querySelector('p-card')).toBeNull();
  });
});
