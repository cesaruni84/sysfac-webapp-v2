import { expect, test } from '@playwright/test';
import { URLS_NEGOCIO } from './urls';

/**
 * Sin sesión: toda URL de negocio debe cargar la SPA (sin 404 del hosting al
 * recargar una ruta profunda) y terminar en la app, no en una página de error.
 */
test.describe('Rutas profundas (sin sesión)', () => {
  test('la raíz lleva al login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sessions(\/signin)?$/);
  });

  for (const url of URLS_NEGOCIO) {
    test(`carga ${url}`, async ({ page }) => {
      const respuesta = await page.goto(url);
      expect(respuesta?.status(), 'el hosting debe servir index.html').toBeLessThan(400);
      await expect(page.locator('app-root')).not.toBeEmpty();
    });
  }
});
