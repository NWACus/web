import { expect, test, type Page } from '@playwright/test'
import { tenantBaseUrl } from '../helpers/tenant-url'

const TENANT_BASE_URL = tenantBaseUrl('nwac')

const SEATTLE = { latitude: 47.6062, longitude: -122.3321 }

/** The "~35 mi away" figures on the list's cards, in order. */
async function listedMiles(page: Page): Promise<number[]> {
  const labels = await page
    .locator('main article')
    .getByText(/mi away$/)
    .allTextContents()
  // "Under 1 mi away" reads as 0; "~35 mi away" as 35.
  return labels.map((label) => Number(label.match(/~(\d+)/)?.[1] ?? 0))
}

/** At least two distances, nearest first. */
const isAscending = (miles: number[]) =>
  miles.length > 1 &&
  miles.every((value, index) => index === 0 || (miles[index - 1] ?? -Infinity) <= value)

test.describe('Events sorted by distance', () => {
  test.describe.configure({ timeout: 60000 })

  test('"Use my location" sorts nearest first without putting the location in the URL', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(SEATTLE)
    await page.goto(`${TENANT_BASE_URL}/events`)

    await page.getByRole('button', { name: 'Soonest first' }).click()
    await page.getByRole('button', { name: 'Use my location' }).click()

    await expect(page.getByRole('button', { name: 'Nearest to you' })).toBeVisible()
    await expect(page).toHaveURL(/[?&]near=me(&|$)/)
    expect(page.url()).not.toContain('47.6')

    await page.getByRole('button', { name: 'Nearest to you' }).click()
    await expect(page.getByRole('button', { name: 'Using your location' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await page.keyboard.press('Escape')

    // Distances show at once; the re-sorted list follows from the server.
    await expect.poll(async () => isAscending(await listedMiles(page))).toBe(true)
  })

  test('a typed place in the URL sorts on the server, with online events last', async ({
    page,
  }) => {
    await page.goto(`${TENANT_BASE_URL}/events?near=47.5951,-120.6624&nearLabel=Leavenworth`)

    await expect(page.getByRole('button', { name: 'Nearest to Leavenworth' })).toBeVisible()
    expect(isAscending(await listedMiles(page))).toBe(true)

    await page.getByRole('button', { name: 'Nearest to Leavenworth' }).click()
    await expect(page.getByRole('combobox', { name: 'Town, trailhead or ZIP' })).toHaveValue(
      'Leavenworth',
    )
    await expect(page.getByRole('button', { name: 'Use my location' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await page.keyboard.press('Escape')

    const onlineHeading = page.getByRole('heading', { name: 'Online & no location' })
    if (await onlineHeading.count()) {
      const followingDistances = page.locator('h3:has-text("Online & no location") ~ div', {
        hasText: /mi away$/,
      })
      await expect(followingDistances).toHaveCount(0)
    }

    await page.getByRole('button', { name: 'Sort soonest first instead' }).click()
    await expect(page).not.toHaveURL(/near=/)
    await expect(page.getByRole('button', { name: 'Soonest first' })).toBeVisible()
  })
})
