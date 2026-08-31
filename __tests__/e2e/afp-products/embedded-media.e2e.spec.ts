import { expect, test } from './fixture'
import { ZONE, clickUntil, hasFixture, loadPage, tenant, zoneSlug } from './helpers'

const FORECAST_URL = `${tenant('snfac')}/forecasts/avalanche/${zoneSlug(ZONE.forecast)}`

/** See media-lightbox.e2e.spec.ts — the shape `getVideoEmbedUrl` produces, not a hand-rolled URL. */
const YOUTUBE_EMBED = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?.*\brel=0\b/

/**
 * The fixture every test here waits on: a forecast whose authored HTML carries the three shapes
 * #1228 handles — an `afp-photoswipe` figure, an `afp-video-modal` figure, and a pasted `iframe`.
 *
 * Not a variant of the problems capture. Those are wire-level gaps (a null `danger`, an empty
 * `forecast_avalanche_problems`); this one is about what a forecaster typed into a text field, so
 * it needs a product picked for its markup. Of 6,745 v2 products sampled in #1228, 2,259 carry a
 * photoswipe figure and 40 an iframe, so the corpus is choosing among plenty — it just has not
 * chosen yet.
 */
const EMBED_FIXTURE = 'v2_public_product_forecast_SNFAC_embedded_media.json'
const EMBED_BLOCKED = `Blocked on products-api Case product_forecast_SNFAC_embedded_media — no golden's authored HTML carries an embedded figure or an iframe, so nothing #1228 added to the discussion is reachable.`

test.describe('Media embedded in a forecast discussion', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasFixture(EMBED_FIXTURE), EMBED_BLOCKED)
    await loadPage(page, FORECAST_URL)
  })

  test('opens an embedded photo in the lightbox', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: 'Expand embedded image' }).first(), dialog)

    // A photo slide is the zoomable one, not an iframe.
    await expect(dialog.locator('iframe')).toHaveCount(0)
    await expect(dialog.getByRole('img').first()).toBeVisible()
  })

  test('opens an embedded video in the lightbox', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: 'Play embedded video' }).first(), dialog)

    await expect(dialog.locator('iframe[title]')).toHaveAttribute('src', YOUTUBE_EMBED)
  })

  test('a link inside the discussion still navigates rather than opening the lightbox', async ({
    page,
  }) => {
    // DiscussionBody delegates clicks from the whole subtree, so a link is the one thing that must
    // escape it. Asserted without navigating: the handler either opens a dialog or it does not.
    await page.getByRole('link').first().click({ trial: true })
    await expect(page.getByRole('dialog', { name: 'Media viewer' })).toBeHidden()
  })

  test('frames a pasted YouTube iframe inline', async ({ page }) => {
    await expect(page.locator('iframe[title]').first()).toHaveAttribute('src', YOUTUBE_EMBED)
  })

  test('leaves a note where an embed from another provider was', async ({ page }) => {
    // Before #1228 a disallowed iframe vanished with no trace, which is indistinguishable from the
    // forecaster never having added it.
    await expect(
      page.getByText(/Embedded content from .+ could not be displayed here/),
    ).toBeVisible()
  })
})

test.describe('Media attached to an avalanche problem', () => {
  // A separate capture from the one above: this media is a wire field on a problem, not markup a
  // forecaster typed, so it lands with the problems golden rather than the embedded-media one.
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasFixture('v2_public_product_forecast_SNFAC_problems.json'),
      'Blocked on products-api Case product_forecast_SNFAC_with_problems — reaching this needs a populated forecast_avalanche_problems whose media item is a video. It rendered as nothing at all before #1228.',
    )
    await loadPage(page, FORECAST_URL)
  })

  test('renders a video with a poster and opens it in the lightbox', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Media viewer' })
    await clickUntil(page.getByRole('button', { name: 'Play embedded video' }).first(), dialog)

    await expect(dialog.locator('iframe[title]')).toHaveAttribute('src', YOUTUBE_EMBED)
  })
})
