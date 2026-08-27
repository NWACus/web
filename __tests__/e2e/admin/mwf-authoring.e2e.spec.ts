// The MWF proof flow end-to-end: sign in, author a morning issuance in the
// custom /admin/mwf view, publish it through the validation-gated modal, and
// see it render on the native public weather page. Runs against DVAC with a
// deliberately tiny MWF config (one zone, one point) installed in beforeAll
// and restored afterward, so authoring every visible field stays fast and
// NWAC's seeded config is untouched.
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { authFile } from '../helpers/auth-state'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
const TENANT = 'dvac'
const PUBLIC_BASE = `http://${TENANT}.${ROOT_DOMAIN}`
// A unique, MONOTONIC far-future service date per run: later runs get later
// dates, so this run's forecast is always the latest visible service date on
// the public page regardless of rows failed earlier runs left behind
// (published slots stay occupied by design; the run withdraws its own row).
const SERVICE_DATE = (() => {
  const minuteBucket = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 60_000)
  const day = new Date(Date.UTC(2031, 0, 1) + minuteBucket * 86_400_000)
  return day.toISOString().slice(0, 10)
})()

const TEST_MWF_CONFIG = {
  zones: [{ code: 'test-zone', name: 'Test Zone', airfireZoneId: null, nacZoneIds: null }],
  points: [
    {
      code: 'test-point',
      name: 'Test Point',
      zoneCode: 'test-zone',
      latitude: 47.5,
      longitude: -121.5,
    },
  ],
  extendedSnowLevelZones: [],
  models: [],
}

let api: APIRequestContext
let settingsId: number
let originalSettings: { nativeProducts: unknown; mwf: unknown }

test.describe.configure({ mode: 'serial' })
test.describe('MWF authoring end-to-end', () => {
  test.setTimeout(180_000)

  test.beforeAll(async () => {
    api = await request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: authFile('superAdmin'),
      // Cookie-authenticated REST calls must pass Payload's CSRF check.
      extraHTTPHeaders: { Origin: 'http://localhost:3000' },
    })
    const tenants = await api.get(`/api/tenants?where[slug][equals]=${TENANT}&depth=0`)
    expect(tenants.ok()).toBeTruthy()
    const tenantId = (await tenants.json()).docs[0].id
    const settings = await api.get(`/api/settings?where[tenant][equals]=${tenantId}&depth=0`)
    expect(settings.ok()).toBeTruthy()
    const doc = (await settings.json()).docs[0]
    settingsId = doc.id
    originalSettings = { nativeProducts: doc.nativeProducts ?? null, mwf: doc.mwf ?? null }

    const update = await api.patch(`/api/settings/${settingsId}`, {
      data: { nativeProducts: { mwf: true }, mwf: TEST_MWF_CONFIG },
    })
    expect(update.ok()).toBeTruthy()
  })

  test.afterAll(async () => {
    if (api && settingsId) {
      await api.patch(`/api/settings/${settingsId}`, { data: originalSettings })
      await api.dispose()
    }
  })

  async function fillCommit(page: Page, label: string, value: string) {
    const input = page.getByLabel(label, { exact: true })
    await input.fill(value)
    await input.press('Enter')
  }

  test('author a morning issuance, publish, and see it on the public page', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('superAdmin') })
    await context.addCookies([
      {
        name: 'payload-tenant',
        value: TENANT,
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 3600,
      },
    ])
    const page = await context.newPage()
    page.on('dialog', (dialog) => void dialog.accept())

    // --- The forecasts list ------------------------------------------------
    await page.goto('/admin/mwf')
    await expect(page.getByRole('heading', { name: 'Mountain Weather Forecast' })).toBeVisible()

    // --- Create the morning issuance --------------------------------------
    await page.getByLabel('Service date').fill(SERVICE_DATE)
    await page.getByLabel('Issuance').selectOption('morning')
    await page.getByRole('button', { name: 'New forecast' }).click()
    await expect(page).toHaveURL(/\/admin\/mwf\?id=\d+/)
    await expect(page.getByRole('heading', { name: /morning Forecast ·/i })).toBeVisible()

    // --- Author every visible field ----------------------------------------
    // The PR #158 morning windows: precip runs D1..D2, temps D1..N1, snow
    // levels am1..pm2, wind the full am1..nt2.
    // QPF and density live on separate metric views (dashboard-v2 layout).
    for (const period of ['D1', 'N1', 'D2']) {
      await fillCommit(page, `test-point ${period} QPF`, '0.5')
    }
    await page.getByRole('button', { name: 'Density', exact: true }).click()
    for (const period of ['D1', 'N1', 'D2']) {
      await fillCommit(page, `test-point ${period} density`, '10')
    }
    // Derived snow appears on the read-only Snow view (0.5 at 10:1 → 5.0).
    await page.getByRole('button', { name: 'Snow', exact: true }).click()
    await expect(page.getByText('5.0').first()).toBeVisible()
    await page.getByRole('button', { name: 'QPF', exact: true }).click()
    for (const period of ['D1', 'N1']) {
      await fillCommit(page, `test-zone ${period} high`, '30')
      await fillCommit(page, `test-zone ${period} low`, '20')
    }
    for (const block of ['am1', 'pm1', 'ev1', 'nt1', 'am2', 'pm2']) {
      await fillCommit(page, `test-zone ${block} level`, '5000')
    }
    for (const block of ['am1', 'pm1', 'ev1', 'nt1', 'am2', 'pm2', 'ev2', 'nt2']) {
      await fillCommit(page, `test-zone ${block} direction`, 'SW')
      await fillCommit(page, `test-zone ${block} speed`, '15')
    }
    await page.getByLabel('test-zone Today / Tonight').fill('Snow showers through tonight.')
    await page.getByLabel('test-zone Tomorrow').fill('Clearing by afternoon.')
    await page.getByLabel('Synopsis', { exact: true }).fill('E2E synopsis: a front moves through.')
    await page.getByLabel('Extended synopsis').fill('E2E extended: ridging builds midweek.')

    // The debounced autosave lands.
    await expect(page.getByTestId('mwf-save-state')).toContainText('Saved', { timeout: 15_000 })

    // --- Publish through the gate ------------------------------------------
    await page.getByRole('button', { name: 'Publish…' }).click()
    const dialog = page.getByRole('dialog', { name: 'Publish forecast' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Publish is blocked')).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Publish', exact: true }).click()
    // Assert durable state, not the ephemeral toast: the modal closes and the
    // status chip flips to published.
    await expect(dialog).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText('published', { exact: true })).toBeVisible()

    // --- The public page renders it ----------------------------------------
    const publicPage = await context.newPage()
    await publicPage.goto(`${PUBLIC_BASE}/weather/forecast`)
    await expect(
      publicPage.getByRole('heading', { name: `morning forecast · ${SERVICE_DATE}` }),
    ).toBeVisible()
    await expect(publicPage.getByText('E2E synopsis: a front moves through.')).toBeVisible()
    await expect(publicPage.getByText('Test Zone').first()).toBeVisible()
    // Derived snow renders from the published body.
    await expect(publicPage.getByText('5" snow').first()).toBeVisible()

    // --- Withdraw hides the issuance (cleanup doubles as the assertion) ----
    await page.getByRole('button', { name: 'Withdraw' }).click()
    await expect(page.getByText('Forecast withdrawn')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/mwf$/)

    await publicPage.reload()
    await expect(publicPage.getByText(/No mountain weather forecast/)).toBeVisible()

    await context.close()
  })
})
