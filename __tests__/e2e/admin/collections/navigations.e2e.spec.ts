import type { Page } from '@playwright/test'
import { authTest, expect } from '../../fixtures/auth.fixture'
import { saveDocAndAssert, waitForFormReady } from '../../helpers'
import { setTenantCookie, TenantSlugs } from '../../helpers/tenant-cookie'

const SERVER_URL = 'http://localhost:3000'

type NavLinkData = { type?: string | null; reference?: unknown; newTab?: boolean | null } | null
type NavItemData = {
  id?: string
  label?: string | null
  link?: NavLinkData
  items?: NavItemData[] | null
}

function collectLinks(items: NavItemData[]): NavLinkData[] {
  return items.flatMap((item) => [item.link ?? null, ...collectLinks(item.items ?? [])])
}

async function readNwacNavigation(page: Page) {
  await setTenantCookie(page.context(), TenantSlugs.nwac)
  await page.goto(`${SERVER_URL}/admin`)

  // The tenant cookie scopes the admin list view, not the REST API, and a super admin's access
  // adds no tenant constraint, so the navigation has to be looked up by tenant explicitly.
  const read = await page.evaluate(async (slug) => {
    const tenants = await fetch(`/api/tenants?where[slug][equals]=${slug}&limit=1&depth=0`)
    const tenantId = (await tenants.json()).docs?.[0]?.id
    const res = await fetch(`/api/navigations?where[tenant][equals]=${tenantId}&limit=1&depth=0`)
    return { ok: res.ok, status: res.status, tenantId, body: await res.json() }
  }, TenantSlugs.nwac)
  expect(read.tenantId, `no ${TenantSlugs.nwac} tenant seeded`).toBeTruthy()
  expect(read.ok, `read navigations failed (${read.status})`).toBeTruthy()

  const doc = read.body.docs?.[0]
  expect(doc, `no navigation seeded for ${TenantSlugs.nwac}`).toBeTruthy()
  return doc
}

/**
 * A nav item with sub-items renders as an accordion, so its own link data is cleared on save.
 * Payload traverses a group's sub-field hooks using whatever that cleanup returns as their
 * siblingData, which makes this the only path that exercises the link field hooks for real.
 * The jest suites build hook args by hand and cannot catch a break here.
 */
authTest.describe('Navigations save', () => {
  authTest.describe.configure({ timeout: 90000 })

  authTest('saves a tab whose item has sub-items', async ({ adminPage }) => {
    const doc = await readNwacNavigation(adminPage)

    const items: NavItemData[] = doc.education?.items ?? []
    expect(
      items.some((item) => (item.items?.length ?? 0) > 0),
      'seeded education tab has no item with sub-items',
    ).toBeTruthy()

    // Round-trips the tab unchanged; the save itself is what's under test.
    const save = await adminPage.evaluate(
      async ({ id, education }) => {
        const res = await fetch(`/api/navigations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ education }),
        })
        return { ok: res.ok, status: res.status, body: await res.json() }
      },
      { id: doc.id, education: doc.education },
    )

    expect(
      save.ok,
      `save failed (${save.status}): ${JSON.stringify(save.body).slice(0, 500)}`,
    ).toBeTruthy()

    // Internal links open in place, so a saved link that resolves to a reference has no newTab
    const savedLinks = collectLinks(save.body.doc?.education?.items ?? [])
    const internalWithNewTab = savedLinks.filter(
      (link) => link && link.type === 'internal' && link.reference && link.newTab,
    )
    expect(internalWithNewTab, 'internal links came back with newTab set').toEqual([])
  })
})

const restoreEducation = (page: Page, id: number, education: unknown) =>
  page.evaluate(
    async ({ id, education }) => {
      await fetch(`/api/navigations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ education }),
      })
    },
    { id, education },
  )

// Opens the Education tab on the first linked item that has no sub-items
async function openLinkedEducationItem(page: Page) {
  const doc = await readNwacNavigation(page)
  const items: NavItemData[] = doc.education?.items ?? []
  const index = items.findIndex((item) => item.link?.reference && !item.items?.length)
  expect(index, 'seeded education tab has no linked item without sub-items').toBeGreaterThanOrEqual(
    0,
  )

  await page.goto(`${SERVER_URL}/admin/collections/navigations/${doc.id}`)
  await waitForFormReady(page)
  await page.getByRole('button', { name: 'Education', exact: true }).first().click()

  const link = page.locator(`#field-education__items__${index}__link`)
  const pageTitle = (await link.locator('.relationship--single-value__text').innerText()).trim()
  const linkLabel = await page
    .locator(`#field-education__items__${index}__link__label`)
    .inputValue()
  // One picker per top-level item, in order
  const typePicker = (name: string) =>
    page.getByRole('radio', { name }).or(page.getByRole('button', { name })).nth(index)

  return { doc, index, link, pageTitle, sectionName: linkLabel || pageTitle, typePicker }
}

authTest.describe('Navigations item type picker', () => {
  authTest.describe.configure({ mode: 'serial', timeout: 90000 })

  authTest(
    'carries the link across when switching to a section and back',
    async ({ adminPage }) => {
      const { index, link, pageTitle, sectionName, typePicker } =
        await openLinkedEducationItem(adminPage)

      await typePicker('Section with sub-items').click()

      await expect(adminPage.locator(`#field-education__items__${index}__label`)).toHaveValue(
        sectionName,
      )
      const firstSubItem = adminPage.locator(`#field-education__items__${index}__items__0__link`)
      await expect(firstSubItem.locator('.relationship--single-value__text')).toHaveText(pageTitle)
      await expect(link).toBeHidden()

      await typePicker('Link to a page').click()

      await expect(link.locator('.relationship--single-value__text')).toHaveText(pageTitle)
      await expect(adminPage.locator(`[id^="education-items-${index}-items-row-"]`)).toHaveCount(0)
    },
  )

  authTest('saves a linked item switched to a section', async ({ adminPage }) => {
    const { doc, index, sectionName, typePicker } = await openLinkedEducationItem(adminPage)
    const reference = doc.education.items[index].link.reference

    try {
      await typePicker('Section with sub-items').click()
      await expect(adminPage.locator(`#field-education__items__${index}__label`)).toHaveValue(
        sectionName,
      )
      await saveDocAndAssert(adminPage)

      const saved = await readNwacNavigation(adminPage)
      const item = saved.education.items[index]
      expect(item.label).toBe(sectionName)
      expect(item.link?.reference ?? null, 'section kept its own link').toBeNull()
      expect(item.items?.map((subItem: NavItemData) => subItem.link?.reference)).toEqual([
        reference,
      ])
    } finally {
      await restoreEducation(adminPage, doc.id, doc.education)
    }
  })
})
