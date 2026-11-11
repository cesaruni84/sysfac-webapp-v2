import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { PaginaNoEncontrada } from './no-encontrada';

describe('PaginaNoEncontrada', () => {
  it('muestra el código 404 y el botón navega a /dashboard', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PaginaNoEncontrada);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('404');
    expect(el.querySelector('i.pi')).not.toBeNull();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    (el.querySelector('p-button button') as HTMLButtonElement).click();
    expect(navegar).toHaveBeenCalledWith(['/dashboard']);
  });
});
