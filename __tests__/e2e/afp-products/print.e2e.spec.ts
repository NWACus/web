import type { Page } from '@playwright/test'
import { expect, test } from './fixture'
import { ZONE, clickUntil, hasFixture, loadPage, tenant, zoneSlug } from './helpers'

const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`
const WARNING_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.warning)}`

/** The two widths docs/afp-products/architecture.md names as the check on print layout. */
const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1440, height: 900 }

/** Wide enough for `printWide` (700) and not for `lg` (1024) — the only gap between the two. */
const NARROWER_THAN_LG = { width: 800, height: 900 }

/**
 * Printing a forecast (inventory row F9).
 *
 * This has to live in a browser. The unit tests cover the bookkeeping — the `data-print-sections`
 * attribute, the renamed `document.title`, the `afterprint` teardown — but the thing that decides
 * what actually comes out of the printer is CSS, and jsdom evaluates none of it. Every assertion
 * here reads `print.css` or a `printWide:` utility doing its job on the real page.
 *
 * Two seams, both unavoidable:
 *
 * - `window.print` is stubbed. No automation can drive a native print dialog. The stub leaves
 *   everything the page did to prepare for printing in place, which is the state a real print is
 *   rendered from, and records that the handoff happened.
 * - `emulateMedia` switches the media type but keeps laying out against the viewport, where a real
 *   print lays out against the paper box. So a `printWide:` (`print and (min-width: 700px)`)
 *   assertion made through it is only sound at a viewport that is itself past 700px. Where the
 *   whole point is that the screen was narrower than that, `page.pdf()` is the only honest
 *   instrument — and it is a real print, so it fires `afterprint` and the page clears its own
 *   selection behind it.
 */

/**
 * Stand in for the browser's print dialog, and record the handoff on the document so the assertion
 * needs no bridge back into page context.
 */
async function stubPrintDialog(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.print = () => document.documentElement.setAttribute('data-print-called', '')
  })
}

/** Walk the reader's path: open the picker, flip the named checkboxes, print. */
async function printWith(page: Page, toggles: string[] = []): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Select forecast sections to print:' })
  await clickUntil(page.getByRole('button', { name: 'Print this forecast' }), dialog)

  for (const label of toggles) {
    await dialog.getByLabel(label).click()
  }
  await dialog.getByRole('button', { name: 'Print', exact: true }).click()

  await expect(page.locator('html')).toHaveAttribute('data-print-called')

  // Wait for the picker to finish closing before returning. A modal Radix dialog marks everything
  // behind it `aria-hidden`, which every role-based locator then skips, and it only lifts that when
  // its exit animation ends — an animation that cannot run once a caller switches to print media
  // and `print:hidden` takes the dialog out of the layout.
  await expect(dialog).toBeHidden()
}

/**
 * A PDF minus the two fields that are a function of when it was generated rather than what is in
 * it. Everything else in the file — page tree, fonts, content streams — is content.
 */
function withoutTimestamps(pdf: Buffer): string {
  return pdf.toString('latin1').replace(/\/(?:CreationDate|ModDate)\s*\([^)]*\)/g, '')
}

test.beforeEach(async ({ page }) => {
  await stubPrintDialog(page)
})

test.describe('Printing a forecast', () => {
  test('offers a checkbox only for the sections this product has content for', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    const dialog = page.getByRole('dialog', { name: 'Select forecast sections to print:' })
    await clickUntil(page.getByRole('button', { name: 'Print this forecast' }), dialog)

    await expect(dialog.getByLabel('Bottom Line & Danger (Recommended)')).toBeVisible()
    await expect(dialog.getByLabel('Forecast Discussion')).toBeVisible()

    // This product carries no problems and its weather product is absent, so neither is offered.
    // The legacy modal rendered Mountain Weather regardless, and unchecking it did nothing.
    // Both flip when Cases product_forecast_SNFAC_with_problems and product_weather_SNFAC_populated
    // land, the same way this spec's danger-rating assertions do.
    await expect(dialog.getByLabel('Avalanche Problems')).toHaveCount(0)
    await expect(dialog.getByLabel('Mountain Weather')).toHaveCount(0)
  })

  test('offers Mountain Weather when the product points at a weather product', async ({ page }) => {
    test.skip(
      !hasFixture('v2_public_product_weather_table_SNFAC.json'),
      'Blocked on products-api Case product_weather_SNFAC_populated — the only weather golden has an empty weather_data and is not served at an id any forecast points at, so no scenario reaches the weather branch.',
    )

    await loadPage(page, FORECAST_URL)

    const dialog = page.getByRole('dialog', { name: 'Select forecast sections to print:' })
    await clickUntil(page.getByRole('button', { name: 'Print this forecast' }), dialog)

    await expect(dialog.getByLabel('Mountain Weather')).toBeChecked()
  })

  test('prints the sections the reader kept and drops the ones they did not', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    const bottomLine = page.getByRole('heading', { name: 'The Bottom Line' })
    const danger = page.getByRole('heading', { name: 'Avalanche Danger' })
    const discussion = page.getByRole('heading', { name: 'Forecast Discussion' })
    await expect(discussion).toBeVisible()

    // The legacy widget's defaults: discussion off, everything else this product has on.
    await printWith(page)
    await expect(page.locator('html')).toHaveAttribute('data-print-sections', 'bottomLine')

    await page.emulateMedia({ media: 'print' })

    await expect(bottomLine).toBeVisible()
    await expect(danger).toBeVisible()
    await expect(discussion).toBeHidden()
  })

  test('prints a section the reader adds', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    await printWith(page, ['Forecast Discussion'])
    await expect(page.locator('html')).toHaveAttribute(
      'data-print-sections',
      'bottomLine discussion',
    )

    await page.emulateMedia({ media: 'print' })

    await expect(page.getByRole('heading', { name: 'Forecast Discussion' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeVisible()
  })

  test('leaves out the site chrome and the screen-only affordances', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    const zoneHeading = page.getByRole('heading', {
      level: 1,
      name: 'Soldier & Wood River Valley Mtns',
    })
    const header = page.locator('header')
    const footer = page.locator('footer')
    const breadcrumbs = page.getByRole('navigation', { name: 'breadcrumb' })
    const datePicker = page.getByRole('button', { name: 'Older forecast' })
    const thumbnail = page.getByRole('button', { name: 'Open media 1 of 4' })
    const printButton = page.getByRole('button', { name: 'Print this forecast' })

    // Asserted on screen first: `toBeHidden` also passes for an element that was never there.
    for (const chrome of [header, footer, breadcrumbs, datePicker, thumbnail, printButton]) {
      await expect(chrome).toBeVisible()
    }

    await printWith(page)
    await page.emulateMedia({ media: 'print' })

    for (const chrome of [header, footer, breadcrumbs, datePicker, thumbnail, printButton]) {
      await expect(chrome).toBeHidden()
    }
    // The product's own title row is a div, not a <header>, precisely so it survives that rule.
    await expect(zoneHeading).toBeVisible()
  })

  test('leaves an announcement banner off the printed forecast', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    const announcement = page.getByRole('heading', { name: 'Backcountry Access Road Closure' })
    test.skip(
      (await announcement.count()) === 0,
      'The seed gives announcements to nwac and dvac only, and neither renders a native forecast — no page in this suite has both a banner and the print control. Turns on if snfac is ever seeded one.',
    )

    // The banners sit beside the site `<header>` rather than inside it, so the rule that hides
    // `<header>` does not reach them; the strip that holds both is what carries `data-print-hide`.
    await expect(announcement).toBeVisible()

    await printWith(page)
    await page.emulateMedia({ media: 'print' })

    await expect(announcement).toBeHidden()
  })

  test('prints an active warning whatever the reader deselected', async ({ page }) => {
    await loadPage(page, WARNING_URL)

    // The legacy widget tied the warning to the "Bottom Line & Danger" checkbox, so a reader who
    // unchecked that printed a forecast with no sign of an active warning on it. The discussion
    // goes on first because unchecking the last remaining section disables Print.
    await printWith(page, ['Forecast Discussion', 'Bottom Line & Danger (Recommended)'])
    await expect(page.locator('html')).toHaveAttribute('data-print-sections', 'discussion')

    await page.emulateMedia({ media: 'print' })

    await expect(
      page.getByRole('heading', { level: 2, name: 'Avalanche Warning in Effect' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The Bottom Line' })).toBeHidden()
  })

  test('prints the expiry and the scope disclaimer whatever the reader deselected', async ({
    page,
  }) => {
    await loadPage(page, FORECAST_URL)

    // Both are outside every toggleable section on purpose: a forecast carried into the field
    // without the time it expires, or without the note that it does not cover ski areas and
    // highways, is a safety gap. The legacy PDF printed neither.
    await printWith(page)
    await page.emulateMedia({ media: 'print' })

    await expect(page.getByText(/Expires:\s*Monday, April 6, 2026/)).toBeVisible()
    await expect(
      page.getByText(/does not apply to ski areas and highways where avalanche mitigation/),
    ).toBeVisible()
  })

  test('leaves a print the reader did not ask for untouched', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    // Everything in print.css is scoped to `html[data-print-sections]`, which only the print
    // control sets. A plain Cmd+P — here or on any other page on the site — gets the whole page.
    await page.emulateMedia({ media: 'print' })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Forecast Discussion' })).toBeVisible()
  })

  test('restores the page once printing ends', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    await printWith(page)
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('footer')).toBeHidden()

    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))

    await expect(page.locator('html')).not.toHaveAttribute('data-print-sections')
    await expect(page.locator('footer')).toBeVisible()
  })

  test('lays the danger days out side by side on paper a screen that width would stack', async ({
    page,
  }) => {
    // 800px is the one window where `printWide:` can be told apart from the breakpoint it shadows:
    // wide enough for `printWide` (700) and not for `lg` (1024). So the screen stacks the two
    // danger days and the print must not — which is only true if the `printWide:flex-row` twin on
    // `DangerDayColumns` is there and sorts after `lg:`.
    await page.setViewportSize(NARROWER_THAN_LG)
    await loadPage(page, FORECAST_URL)

    const today = page.getByRole('heading', { level: 4, name: 'Sunday, April 5, 2026' })
    const tomorrow = page.getByRole('heading', { level: 4, name: 'Monday, April 6, 2026' })

    expect((await today.boundingBox())?.y).not.toBe((await tomorrow.boundingBox())?.y)

    await printWith(page)
    await page.emulateMedia({ media: 'print' })

    expect((await today.boundingBox())?.y).toBe((await tomorrow.boundingBox())?.y)
  })

  test('forbids a page boundary from cutting through a card', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    const cards = page.locator('[data-print-section="bottomLine"] > *')
    await expect(cards).not.toHaveCount(0)

    await printWith(page)
    await page.emulateMedia({ media: 'print' })

    // The defect: the danger scale's color strip printed at the top of the sheet after the ratings
    // it decodes. Asserted as the computed property rather than by reading page assignments out of
    // a PDF — *where* the break lands is a function of how long the forecaster wrote, but whether
    // the browser may break here at all is not, and that is the part worth pinning.
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS('break-inside', 'avoid')
    }
  })

  test('gives a card tighter padding on paper than on screen', async ({ page }) => {
    await loadPage(page, FORECAST_URL)

    // print.css reaches every card through the `data-slot` hooks on the Card primitive. Worth about
    // a page-eighth per card, which is what keeps the danger card inside the first sheet — so a
    // rename of those hooks has to fail here rather than quietly cost a sheet of paper.
    const cardContent = page.locator('[data-print-section="bottomLine"] [data-slot="card-content"]')
    await expect(cardContent.first()).toHaveCSS('padding-bottom', '24px')

    await printWith(page)
    await page.emulateMedia({ media: 'print' })

    await expect(cardContent.first()).toHaveCSS('padding-bottom', '16px')
  })

  test('lays the printed page out the same from a phone and from a desktop', async ({
    page,
    headless,
  }) => {
    test.skip(!headless, 'page.pdf() is Chromium-headless only')

    await loadPage(page, FORECAST_URL)

    // One trip through the picker per render, not one for both: `page.pdf()` is a real print, so it
    // fires `afterprint`, and the component's own teardown clears the selection behind it. Reusing
    // a single selection would compare a printed forecast against an ordinary print of the page.
    await printWith(page)
    await page.setViewportSize(PHONE)
    const fromPhone = withoutTimestamps(await page.pdf())

    await printWith(page)
    await page.setViewportSize(DESKTOP)
    const fromDesktop = withoutTimestamps(await page.pdf())

    // A browser lays print out against the paper box, so the forecast a reader carries into the
    // field must not depend on the screen they printed it from. Compared as whole files rather
    // than by sampling elements, because what this catches is not enumerable: anything that
    // measures the viewport in JS and leaves the result in the DOM — an inline height off a
    // ResizeObserver, content rendered only above a width — reaches the print through a path no
    // per-element assertion would think to check.
    //
    // What it cannot catch is a missing `printWide:` twin: both widths would then be laid out the
    // same wrong way and still agree. The test above covers that case.
    expect(
      fromPhone === fromDesktop,
      'The same product printed at 390px and at 1440px produced different PDFs, so something in the print layout is still reading the reader’s screen.',
    ).toBe(true)
  })
})
