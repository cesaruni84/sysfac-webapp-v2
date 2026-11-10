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

  test('no muestra el aviso de licencia de PrimeUI', async ({ page }) => {
    // PrimeNG 22+ inyecta #p-license-host sin clave de licencia; v2 usa 21.1.10 (MIT).
    await page.goto('/sessions/signin');
    await expect(page.locator('app-root')).not.toBeEmpty();
    await expect(page.locator('#p-license-host')).toHaveCount(0);
  });
});
