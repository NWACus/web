import type { Page } from '@playwright/test'
import { expect, test } from './fixture'
import { loadPage, tenant } from './helpers'

/**
 * nac-widgets.css hides the forecast widget's own h1 only where AvyWeb prints its own title
 * (`data-hide-widget-title`). Every widget forecast product renders in the same container, so an
 * unscoped rule also hid the product-type title on the avalanche pages.
 *
 * sac is seeded on the widget. The suite stubs the widget CDN, so each spec draws a stand-in for
 * the widget's title markup and asserts what the stylesheet does to it.
 */

/** Open a widget page and wait for hydration, which the widget router marks by setting the hash. */
async function openWidgetPage(page: Page, path: string, hash: RegExp) {
  const errors = await loadPage(page, `${tenant('sac')}${path}`)
  await expect(page).toHaveURL(hash)
  return errors
}

/** Draw the widget's product title the way the real widget does, inside its mount. */
async function drawWidgetTitle(page: Page, title: string) {
  await page.locator('#nac-widget-forecast').evaluate((mount, text) => {
    const container = document.createElement('div')
    container.id = 'nac-forecast-container'
    const heading = document.createElement('h1')
    heading.className = 'nac-h1'
    heading.textContent = text
    container.append(heading)
    mount.append(container)
  }, title)
  return page.locator('#nac-forecast-container h1.nac-h1')
}

/** Pages that print no title of their own, so the widget's product-type title has to show. */
const UNTITLED_PAGES = [
  { name: 'the all-zones page', path: '/forecasts/avalanche', hash: /#\/all$/ },
  {
    name: 'a zone page',
    path: '/forecasts/avalanche/central-sierra-nevada',
    hash: /#\/central-sierra-nevada$/,
  },
]

/** Pages that print their own "Mountain Weather" h1, so the widget's duplicate has to hide. */
const TITLED_PAGES = [
  { name: 'Mountain Weather', path: '/weather/forecast', hash: /#\/weather$/ },
  {
    name: 'an archived Mountain Weather product',
    path: '/forecasts/avalanche/archive/mountain-weather/184563',
    hash: /#\/weather\/184563$/,
  },
]

test.describe('Forecast widget title', () => {
  for (const { name, path, hash } of UNTITLED_PAGES) {
    test(`shows on ${name}`, async ({ page }) => {
      const errors = await openWidgetPage(page, path, hash)

      const title = await drawWidgetTitle(page, 'Backcountry Avalanche Forecast')

      await expect(title).toBeVisible()
      expect(errors).toEqual([])
    })
  }

  for (const { name, path, hash } of TITLED_PAGES) {
    test(`is hidden on ${name}`, async ({ page }) => {
      const errors = await openWidgetPage(page, path, hash)

      const title = await drawWidgetTitle(page, 'Mountain Weather')

      await expect(title).toBeHidden()
      await expect(page.getByRole('heading', { level: 1, name: 'Mountain Weather' })).toHaveCount(1)
      expect(errors).toEqual([])
    })
  }
})
