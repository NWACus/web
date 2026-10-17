import type { Page } from '@playwright/test'
import { authTest, expect } from '../../fixtures/auth.fixture'
import { waitForFormReady } from '../../helpers'
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

async function patchEducation(page: Page, id: number, education: unknown) {
  return page.evaluate(
    async ({ id, education }) => {
      const res = await fetch(`/api/navigations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ education }),
      })
      return { ok: res.ok, status: res.status, body: await res.json() }
    },
    { id, education },
  )
}

function findLinkedItemIndex(items: NavItemData[]): number {
  const index = items.findIndex((item) => item.link?.reference && !item.items?.length)
  expect(index, 'seeded education tab has no linked item without sub-items').toBeGreaterThanOrEqual(
    0,
  )
  return index
}

/**
 * Saving a tab whose item has sub-items runs the nested link field hooks for real.
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
    const save = await patchEducation(adminPage, doc.id, doc.education)

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

// Giving a linked item its first sub-item used to hide its link in the editor and wipe it on save.
authTest.describe('Navigations item with a link gaining sub-items', () => {
  authTest.describe.configure({ mode: 'serial', timeout: 90000 })

  authTest('keeps the link visible in the editor', async ({ adminPage }) => {
    const doc = await readNwacNavigation(adminPage)
    const index = findLinkedItemIndex(doc.education?.items ?? [])

    await adminPage.goto(`${SERVER_URL}/admin/collections/navigations/${doc.id}`)
    await waitForFormReady(adminPage)
    await adminPage.getByRole('button', { name: 'Education', exact: true }).first().click()

    const link = adminPage.locator(`#field-education__items__${index}__link`)
    await expect(link).toBeVisible()
    const pageTitle = (await link.locator('.relationship--single-value__text').innerText()).trim()
    expect(pageTitle, 'linked item shows no page').toBeTruthy()

    await adminPage
      .locator(`#field-education__items__${index}__items`)
      .getByRole('button', { name: 'Add Item' })
      .click()

    await expect(adminPage.locator(`#education-items-${index}-items-row-0`)).toBeVisible()
    // The section label appears once the form state for the new sub-item comes back
    await expect(adminPage.locator(`#field-education__items__${index}__label`)).toBeVisible()
    await expect(link).toBeVisible()
    await expect(link.locator('.relationship--single-value__text')).toHaveText(pageTitle)
  })

  authTest('keeps the link when saved with sub-items', async ({ adminPage }) => {
    const doc = await readNwacNavigation(adminPage)
    const items: NavItemData[] = doc.education?.items ?? []
    const index = findLinkedItemIndex(items)
    const item = items[index]
    const subItemLink = { ...item.link, id: undefined }

    const education = {
      ...doc.education,
      items: items.map((navItem, i) =>
        i === index ? { ...navItem, label: 'Section', items: [{ link: subItemLink }] } : navItem,
      ),
    }

    try {
      const save = await patchEducation(adminPage, doc.id, education)
      expect(
        save.ok,
        `save failed (${save.status}): ${JSON.stringify(save.body).slice(0, 500)}`,
      ).toBeTruthy()

      const saved: NavItemData | undefined = save.body.doc?.education?.items?.[index]
      expect(saved?.items?.length).toBe(1)
      expect(saved?.link?.reference, 'link was cleared on save').toBeTruthy()
    } finally {
      await patchEducation(adminPage, doc.id, doc.education)
    }
  })
})
