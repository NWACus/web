import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixture'
import { ZONE, hasFixture, loadPage, tenant, zoneSlug } from './helpers'

const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`

const PHONE = { width: 375, height: 812 }
const DESKTOP = { width: 1280, height: 800 }

/** The golden's outlook day. Its ratings are null on the wire, so each band reads "No Rating". */
const OUTLOOK = 'Monday, April 6, 2026'

const PROBLEMS_BLOCKED =
  'Blocked on products-api Case product_forecast_SNFAC_with_problems — no golden in the corpus has a populated forecast_avalanche_problems array.'

/** The forecast at phone width, with its collapsed outlook row and the panel that row controls. */
async function openOnPhone(page: Page): Promise<{ toggle: Locator; panel: Locator }> {
  await page.setViewportSize(PHONE)
  await loadPage(page, FORECAST_URL)

  const toggle = page.getByRole('button', { name: OUTLOOK })
  const panel = page.locator(`[id="${await toggle.getAttribute('aria-controls')}"]`)
  return { toggle, panel }
}

/**
 * The danger and problems sections' reader-facing controls: the help popovers (Forecast-59,
 * Forecast-79), the phone's collapsed outlook (Forecast-66) and the no-outlook advice column
 * (Forecast-67). What only a browser can tell: a keypress opens and closes a popover, a breakpoint
 * swaps one outlook for the other, and print forces the collapsed one open.
 */
test.describe('Danger and problems sections', () => {
  test('opens the Avalanche Danger help from the keyboard and closes it on Escape', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP)
    await loadPage(page, FORECAST_URL)

    const trigger = page.getByRole('button', { name: 'About Avalanche Danger' })
    const help = page.getByText(/is a tool used by avalanche forecasters/)

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(help).toBeVisible()
    // The widget's string had a doubled quote in this href; ours must not.
    await expect(page.getByRole('link', { name: 'video' })).toHaveAttribute(
      'href',
      'https://avalanche.org/avalanche-encyclopedia/danger-scale/',
    )

    await page.keyboard.press('Escape')
    await expect(help).toBeHidden()
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Space')
    await expect(help).toBeVisible()
  })

  test('keeps the help marker off paper', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await loadPage(page, FORECAST_URL)

    await page.emulateMedia({ media: 'print' })

    await expect(page.getByRole('heading', { name: 'Avalanche Danger' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'About Avalanche Danger' })).toBeHidden()
  })

  test("leaves out Elevation Band Descriptions for a center that hasn't set one", async ({
    page,
  }) => {
    await loadPage(page, FORECAST_URL)

    // SNFAC's metadata golden carries an empty elevInfoUrl (Forecast-60).
    await expect(page.getByRole('heading', { name: 'Avalanche Danger' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Elevation Band Descriptions/ })).toHaveCount(0)
  })

  test('collapses the outlook on a phone and expands it on tap', async ({ page }) => {
    const { toggle, panel } = await openOnPhone(page)

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()

    await toggle.click()

    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(panel.getByText('0 - No Rating')).toHaveCount(3)
    await expect(panel.getByText('0 - No Rating').first()).toBeVisible()

    await toggle.click()
    await expect(panel).toBeHidden()
  })

  test('keeps the outlook column on desktop, with no collapsed row', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await loadPage(page, FORECAST_URL)

    await expect(page.getByRole('heading', { level: 4, name: OUTLOOK })).toBeVisible()
    await expect(page.getByRole('button', { name: OUTLOOK })).toBeHidden()
  })

  // `emulateMedia` lays out against the 375px viewport, so this is narrow paper, where the
  // collapsed row is what prints: it has to print open.
  test('prints the collapsed outlook open', async ({ page }) => {
    const { panel } = await openOnPhone(page)
    await expect(panel).toBeHidden()

    await page.emulateMedia({ media: 'print' })

    await expect(panel).toBeVisible()
  })

  test("fills the outlook's column with today's travel advice when there is no outlook", async ({
    page,
  }) => {
    test.skip(
      !hasFixture('v2_public_product_forecast_no_outlook.json'),
      'Blocked on a capture not yet filed upstream — every golden and every SNFAC/SAC/NWAC forecast from Jan–Mar 2026 carries a tomorrow entry; GNFAC (never issues an outlook) is not a seeded tenant.',
    )

    // Repoint at the zone the capture is served at when it lands; this zone has an outlook.
    await page.setViewportSize(DESKTOP)
    await loadPage(page, FORECAST_URL)

    const advice = page.getByRole('list', { name: 'Travel advice' })
    await expect(advice).toBeVisible()
    await expect(advice.getByRole('listitem')).toHaveCount(3)

    await page.setViewportSize(PHONE)
    await expect(advice).toBeHidden()
  })

  test('opens the Avalanche Problems help and each problem type’s description', async ({
    page,
  }) => {
    test.skip(!hasFixture('v2_public_product_forecast_SNFAC_problems.json'), PROBLEMS_BLOCKED)

    await page.setViewportSize(DESKTOP)
    await loadPage(page, FORECAST_URL)

    await page.getByRole('button', { name: 'About Avalanche Problems' }).click()
    await expect(page.getByText(/use four factors to give a more nuanced/)).toBeVisible()
    await page.keyboard.press('Escape')

    const typeTrigger = page.getByRole('button', { name: /^What ".+" means$/ }).first()
    await typeTrigger.hover()
    await expect(page.getByText('Click to learn more').first()).toBeVisible()
    await typeTrigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
