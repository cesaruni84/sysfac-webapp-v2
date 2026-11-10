import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas e2e de humo (tarea 0.7). Se parametrizan por URL para ejecutarse contra v1 y v2:
 *
 *   BASE_URL=https://<v1>             npx playwright test   # v1 en Firebase
 *   BASE_URL=https://<rama>.sysfac-webapp-v2.pages.dev npx playwright test
 *   npx playwright test                                      # v2 local (levanta ng serve)
 *
 * Credenciales opcionales (nunca en el repo): E2E_USER, E2E_PASS y E2E_EMPRESA.
 * Las pruebas son SOLO DE LECTURA: no crean, modifican ni eliminan datos.
 */
const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'es-PE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env['BASE_URL']
    ? undefined
    : {
        command: 'npx ng serve --port 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
