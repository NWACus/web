import { expect, test } from './fixture'
import { ZONE, clickUntil, hasFixture, loadPage, tenant, zoneSlug } from './helpers'

const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`

/**
 * What `getVideoEmbedUrl` frames a YouTube video at: the nocookie host, an 11-char id, and the
 * `rel=0` it always appends. The exact string is pinned by MediaSlide's unit test — this asserts
 * only that the real page reaches that helper, not a hand-rolled URL.
 */
const YOUTUBE_EMBED = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?.*\brel=0\b/

test.beforeEach(async ({ page }) => {
  await loadPage(page, FORECAST_URL)
})

test.describe('Media lightbox', () => {
  test('opens on the thumbnail that was clicked', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: 'Open media 2 of 4' }), dialog)

    await expect(dialog.getByText('2 / 4')).toBeVisible()
  })

  test('navigates between slides', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: 'Open media 1 of 4' }), dialog)

    await dialog.getByRole('button', { name: 'Next' }).click()
    await expect(dialog.getByText('2 / 4')).toBeVisible()

    await dialog.getByRole('button', { name: 'Next' }).click()
    await expect(dialog.getByText('3 / 4')).toBeVisible()

    await dialog.getByRole('button', { name: 'Previous' }).click()
    await expect(dialog.getByText('2 / 4')).toBeVisible()
  })

  test('arrow keys advance exactly one slide', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: 'Open media 1 of 4' }), dialog)
    await expect(dialog.getByText('1 / 4')).toBeVisible()

    await page.keyboard.press('ArrowRight')
    await expect(dialog.getByText('2 / 4')).toBeVisible()

    await page.keyboard.press('ArrowLeft')
    await expect(dialog.getByText('1 / 4')).toBeVisible()
  })

  test('closes on Escape', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: 'Open media 1 of 4' }), dialog)

    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog', { name: 'Media viewer' })).toBeHidden()
  })

  test('embeds a YouTube video slide', async ({ page }) => {
    test.skip(
      !hasFixture('v2_public_product_forecast_SNFAC_problems.json'),
      'Blocked on products-api Case product_forecast_SNFAC_with_problems — no product golden carries a media item of type "video", so the YouTube branch is unreachable. #1228 shipped the rendering; the gap is the capture.',
    )

    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: /^Open media/ }).first(), dialog)

    await expect(dialog.locator('iframe[title]')).toHaveAttribute('src', YOUTUBE_EMBED)
  })
})
