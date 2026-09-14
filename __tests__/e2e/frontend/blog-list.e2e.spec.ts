import { expect, authTest as test } from '../fixtures/auth.fixture'
import {
  TenantIds,
  TenantSlugs,
  apiRequest,
  createPublishedDoc,
  deleteDoc,
  setTenantCookie,
  tenantBaseUrl,
} from '../helpers'

const TENANT_BASE_URL = tenantBaseUrl('nwac')

test.describe('Blog List block', () => {
  test.describe.configure({ timeout: 90000 })

  test('prerendered "View all" link already carries the tag filter', async ({
    adminPage,
    browser,
  }) => {
    await setTenantCookie(adminPage.context(), TenantSlugs.nwac)
    await adminPage.goto('/admin')

    const tags = await apiRequest(
      adminPage,
      `/api/tags?where[slug][equals]=education&where[tenant][equals]=${TenantIds.nwac}&depth=0`,
    )
    const tagId = tags.body.docs[0]?.id
    expect(tagId, 'seeded nwac "education" tag').toBeTruthy()

    const slug = `e2e-blog-list-${Date.now()}`
    const heading = 'Education posts'
    const pageId = await createPublishedDoc(adminPage, 'pages', {
      slug,
      title: 'E2E blog list page',
      layout: [
        {
          blockType: 'blogList',
          heading,
          backgroundColor: 'transparent',
          postOptions: 'dynamic',
          dynamicOptions: { sortBy: '-publishedAt', filterByTags: [tagId], maxPosts: 4 },
        },
      ],
    })

    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      const response = await page.goto(`${TENANT_BASE_URL}/${slug}`)
      if (!response) throw new Error('no response for page navigation')
      expect(response.status()).toBe(200)

      // Response.text() is the server-rendered HTML, before any hydration. The
      // regression in #1160 was a "View all" href that was only correct after
      // hydration, so an assertion on the live DOM would not have caught it.
      const html = await response.text()
      // Match the View all link's href, with `&` HTML-escaped as `&amp;`
      expect(html).toMatch(/href="\/blog\?[^"]*tags=education/)

      // And the hydrated link agrees
      const viewAll = page.getByRole('link', { name: `View all ${heading}` })
      await expect(viewAll).toHaveAttribute('href', /tags=education/)
      await expect(viewAll).toHaveAttribute('href', /sort=-publishedAt/)
    } finally {
      await context.close()
      await deleteDoc(adminPage, 'pages', pageId)
    }
  })
})
