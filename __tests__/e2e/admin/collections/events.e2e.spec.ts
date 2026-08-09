import { authTest, expect } from '../../fixtures/auth.fixture'
import { AdminUrlUtil } from '../../helpers/admin-url'
import { deleteDoc } from '../../helpers/create-doc'
import { waitForFormReady } from '../../helpers/save-doc'
import { setTenantCookie, TenantSlugs } from '../../helpers/tenant-cookie'

const SERVER_URL = 'http://localhost:3000'
const START_DATE = '2025-11-13T18:00:00.000Z'

/**
 * Creates a draft event (nwac) with a known title + start date and returns its id.
 * `?draft=true` skips required-field validation; the slug is intentionally left blank
 * so the auto-generate behavior can be exercised in the editor.
 */
async function createDraftEvent(page: import('@playwright/test').Page): Promise<number> {
  const result = await page.evaluate(
    async ({ startDate }) => {
      const res = await fetch('/api/events?draft=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: 2, // nwac
          _status: 'draft',
          title: 'E2E Awareness Class',
          startDate,
          type: 'awareness',
        }),
      })
      return { ok: res.ok, status: res.status, body: await res.json() }
    },
    { startDate: START_DATE },
  )

  expect(
    result.ok,
    `create event failed (${result.status}): ${JSON.stringify(result.body)}`,
  ).toBeTruthy()
  return result.body.doc.id
}

authTest.describe('Events collection slug field', () => {
  authTest.describe.configure({ mode: 'serial', timeout: 90000 })

  authTest('shows the auto-generate description for the slug field', async ({ adminPage }) => {
    const eventsUrl = new AdminUrlUtil(SERVER_URL, 'events')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    await adminPage.goto(eventsUrl.list)
    const eventId = await createDraftEvent(adminPage)

    try {
      await adminPage.goto(eventsUrl.edit(eventId))
      await waitForFormReady(adminPage)

      await expect(adminPage.locator('#field-slug')).toBeVisible({ timeout: 10000 })
      // The custom SlugComponent must render admin.description itself; assert it's visible.
      await expect(
        adminPage.getByText('Duplicates get a numbered suffix.', { exact: false }),
      ).toBeVisible()
    } finally {
      await deleteDoc(adminPage, 'events', eventId)
    }
  })

  authTest('regenerate button builds the slug from title + start date', async ({ adminPage }) => {
    const eventsUrl = new AdminUrlUtil(SERVER_URL, 'events')
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)

    await adminPage.goto(eventsUrl.list)
    const eventId = await createDraftEvent(adminPage)

    try {
      await adminPage.goto(eventsUrl.edit(eventId))
      await waitForFormReady(adminPage)

      const slugInput = adminPage.locator('#field-slug')
      await slugInput.fill('')

      // The refresh button lives inside the slug field wrapper.
      const slugFieldWrapper = adminPage
        .locator('.field-type.relative')
        .filter({ has: adminPage.locator('#field-slug') })
      await slugFieldWrapper.locator('button').click()

      // Slug is title kebab-cased + the start date (2025-11-13), matching the server hook.
      await expect(slugInput).toHaveValue('e2e-awareness-class-2025-11-13')
    } finally {
      await deleteDoc(adminPage, 'events', eventId)
    }
  })
})
