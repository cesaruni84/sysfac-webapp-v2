import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { PaginaError } from './error';

describe('PaginaError', () => {
  it('muestra el código 500 y el botón navega a /dashboard', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PaginaError);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('500');
    expect(el.querySelector('i.pi')).not.toBeNull();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    (el.querySelector('p-button button') as HTMLButtonElement).click();
    expect(navegar).toHaveBeenCalledWith(['/dashboard']);
  });
});
