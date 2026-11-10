import { expect, test } from '@playwright/test';
import { URLS_NEGOCIO } from './urls';

const usuario = process.env['E2E_USER'];
const clave = process.env['E2E_PASS'];
const empresa = process.env['E2E_EMPRESA'];

/**
 * Con sesión (solo lectura). Los selectores usan los atributos `name` de v1
 * (username, password, empresaSelected) y el botón "Ingresar"; la pantalla 4.1
 * de v2 debe conservarlos para que esta suite sirva contra ambas versiones.
 */
test.describe('Login y navegación (con sesión)', () => {
  test.skip(!usuario || !clave, 'Definir E2E_USER y E2E_PASS para ejecutar estas pruebas');

  test.beforeEach(async ({ page }) => {
    await page.goto('/sessions/signin');
    await page.locator('[name="username"]').fill(usuario!);
    await page.locator('[name="password"]').fill(clave!);
    await page.locator('[name="empresaSelected"]').click();
    const opciones = page.getByRole('option');
    await (empresa ? opciones.filter({ hasText: empresa }).first() : opciones.first()).click();
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('entra al dashboard', async ({ page }) => {
    await expect(page.locator('app-root')).not.toBeEmpty();
  });

  test('navega por todas las pantallas de negocio sin volver al login', async ({ page }) => {
    for (const url of URLS_NEGOCIO) {
      await page.goto(url);
      await expect(page, `al abrir ${url}`).not.toHaveURL(/\/sessions/);
    }
  });
});
