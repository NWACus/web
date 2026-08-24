import { expect, type Locator, type Page } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot } from './mockState'

const PORT = process.env.E2E_MOCK_PORT || '3100'

/** A tenant's origin. The middleware resolves the tenant from the subdomain. */
export function tenant(slug: string): string {
  return `http://${slug}.localhost:${PORT}`
}

// Read rather than imported: an ESM JSON import needs an import attribute, which the TypeScript
// the Playwright runner emits does not carry.
function scenarioProducts(): { zone?: number; zoneSlug?: string }[] {
  const parsed: unknown = JSON.parse(
    readFileSync(join(repoRoot, '__tests__/e2e/mocks/scenarios.json'), 'utf8'),
  )
  if (
    parsed &&
    typeof parsed === 'object' &&
    'products' in parsed &&
    Array.isArray(parsed.products)
  ) {
    return parsed.products
  }
  throw new Error('scenarios.json has no products list')
}

/** The zone slug a scenario is served at, so a spec cannot drift from the mock. */
export function zoneSlug(zoneId: number): string {
  const product = scenarioProducts().find((entry) => entry.zone === zoneId && entry.zoneSlug)
  if (!product?.zoneSlug) throw new Error(`No zoneSlug recorded for zone ${zoneId}`)
  return product.zoneSlug
}

/** Whether a fixture is available yet, for tests blocked on an upstream capture. */
export function hasFixture(name: string): boolean {
  return (
    existsSync(join(repoRoot, '__tests__/e2e/mocks/afp-golden', name)) ||
    existsSync(join(repoRoot, '__tests__/e2e/mocks/provisional', name))
  )
}

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Stub the third-party assets a rendered page references.
 *
 * MSW intercepts in the Next process, so it cannot see these — they are the browser's own
 * requests. Left live they would make the suite depend on S3, YouTube and a CloudFront CDN being
 * reachable, and each of them delays the `load` event `page.goto` waits on. Fulfilled rather than
 * aborted, because an aborted widget stylesheet logs a console error the widget spec asserts on.
 */
export async function stubExternalAssets(page: Page): Promise<void> {
  await page.route('**/*.s3.*.amazonaws.com/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: TRANSPARENT_PNG }),
  )
  await page.route('**/www.youtube.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '' }),
  )
  // Next's image optimizer fetches Payload media over HTTP, which is not present on a local
  // checkout — and optimising a logo is not what this suite is testing.
  await page.route('**/_next/image**', (route) =>
    route.fulfill({ contentType: 'image/png', body: TRANSPARENT_PNG }),
  )
  await page.route('**/*.cloudfront.net/**', (route) =>
    route.fulfill({
      contentType: route.request().url().endsWith('.css') ? 'text/css' : 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: '',
    }),
  )
}

/**
 * Neutralise the revalidate-on-view check for specs that are not about freshness. It answers 304
 * for a byte-stable fixture anyway, but a stubbed request cannot refresh the page mid-assertion.
 */
export async function freezeFreshness(page: Page): Promise<void> {
  await page.route('**/forecast-freshness*', (route) => route.abort('failed'))
}

/** Fail a spec on a 5xx or an uncaught page error, the way the existing frontend suite does. */
export async function loadPage(page: Page, url: string): Promise<string[]> {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('response', (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`)
  })

  await page.goto(url, { waitUntil: 'load' })
  return errors
}

/**
 * Click, and keep clicking until the interaction takes effect.
 *
 * These pages are server-rendered, so a button exists in the HTML before React has hydrated its
 * handler. Playwright's own retries cover an element that is not yet actionable, not one that is
 * actionable but inert — without this, every interactive spec is a race against hydration.
 */
export async function clickUntil(target: Locator, expected: Locator): Promise<void> {
  await expect(async () => {
    await target.click()
    await expect(expected).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
}

/** The zone ids each scenario is served at, named so specs read as intent rather than numbers. */
export const ZONE = {
  offSeasonSummary: 2904,
  forecast: 2905,
  warning: 2906,
  freshness: 2907,
} as const
