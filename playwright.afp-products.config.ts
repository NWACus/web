import { defineConfig, devices } from '@playwright/test'

/**
 * E2E for the native AFP product pages, against a production build whose upstream API is mocked.
 *
 * A separate config rather than a fourth project in `playwright.config.ts`, for two reasons.
 * Playwright has no per-project `webServer`, so a mocked entry there would boot for
 * `pnpm test:e2e:admin` too; and this suite needs a production build (the prerendered page is what
 * a reader gets, and it is what makes the freshness path observable), where the rest of the suite
 * runs against `pnpm dev`.
 *
 * See docs/afp-products/e2e-mocks.md.
 */
const PORT = process.env.E2E_MOCK_PORT || '3100'

export default defineConfig({
  testDir: './__tests__/e2e/afp-products',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60000,
  expect: { timeout: 10000 },
  globalSetup: './__tests__/e2e/afp-products/globalSetup.ts',
  globalTeardown: './__tests__/e2e/afp-products/globalTeardown.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'afp-products',
      testIgnore: '**/freshness.e2e.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Last, and on its own: the freshness path calls `revalidateTag`, which drops the cached
      // render of every page sharing those tags. They regenerate — but carrying the *corrected*
      // product, which is not what a spec that ran earlier asserted against.
      name: 'afp-products-freshness',
      testMatch: '**/freshness.e2e.spec.ts',
      dependencies: ['afp-products'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm e2e:start',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    // A cold production build runs first when there is no current mocked build.
    timeout: 900000,
    env: { PORT },
  },
})
