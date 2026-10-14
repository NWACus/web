// Real block configs are used thanks to ESM transform support in jest.config.mjs.
// lexicalEditor() calls at module initialization need a stub since there's no running Payload instance.
jest.mock('@payloadcms/richtext-lexical', () => ({
  lexicalEditor: () => ({}),
  BlocksFeature: () => ({ key: 'blocks' }),
  FixedToolbarFeature: () => ({}),
  HeadingFeature: () => ({}),
  HorizontalRuleFeature: () => ({}),
  InlineToolbarFeature: () => ({}),
  AlignFeature: () => ({}),
  ParagraphFeature: () => ({}),
  UnderlineFeature: () => ({}),
  BoldFeature: () => ({}),
  ItalicFeature: () => ({}),
  LinkFeature: () => ({}),
}))

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { Pages } from '@/collections/Pages'
import { duplicatePageToTenant } from '@/collections/Pages/endpoints/duplicatePageToTenant'
import type { Field, Payload, PayloadRequest } from 'payload'
import { getPayload } from 'payload'

const mockFind = jest.fn()
const mockCreate = jest.fn()

const mockTenant = { id: 42, name: 'Test AC', slug: 'tac' }

beforeEach(() => {
  jest
    .mocked(getPayload)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .mockResolvedValue({ find: mockFind, create: mockCreate } as unknown as Payload)
  // First find call: tenant lookup. Second find call: slug existence check (no conflict by default).
  mockFind
    .mockReset()
    .mockResolvedValueOnce({ docs: [mockTenant] })
    .mockResolvedValueOnce({ docs: [] })
  mockCreate.mockReset().mockResolvedValue({ id: 99 })
})

function buildRequest(
  tenantSlug: string | undefined,
  body: Record<string, unknown>,
): PayloadRequest {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    routeParams: tenantSlug !== undefined ? { tenantSlug } : undefined,
    json: async () => body,
  } as unknown as PayloadRequest
}

// The block slugs a Page's layout field offers
function layoutBlockSlugs(fields: Field[]): string[] {
  return fields.flatMap((field) => {
    if (field.type === 'tabs') return field.tabs.flatMap((tab) => layoutBlockSlugs(tab.fields))
    if (field.type === 'blocks' && field.name === 'layout') {
      return field.blocks.flatMap((block) => (typeof block === 'string' ? [] : [block.slug]))
    }
    return []
  })
}

describe('duplicatePageToTenant', () => {
  it('creates the page as a draft', async () => {
    const req = buildRequest('42', {
      newPage: { title: 'About', slug: 'about', layout: [] },
    })
    await duplicatePageToTenant(req)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ draft: true }))
  })

  it('appends " - Copy" when a page with the same slug exists', async () => {
    // Slug existence check returns a match
    mockFind
      .mockReset()
      .mockResolvedValueOnce({ docs: [mockTenant] })
      .mockResolvedValueOnce({ docs: [{ id: 1, slug: 'about-us' }] })
    const req = buildRequest('42', {
      newPage: { title: 'About Us', slug: 'about-us', layout: [] },
    })
    await duplicatePageToTenant(req)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'About Us - Copy', slug: 'about-us-copy' }),
      }),
    )
  })

  it('keeps original title and slug when no conflict exists', async () => {
    const req = buildRequest('42', {
      newPage: { title: 'About Us', slug: 'about-us', layout: [] },
    })
    await duplicatePageToTenant(req)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'About Us', slug: 'about-us' }),
      }),
    )
  })

  it('sets the tenant from the lookup result', async () => {
    const req = buildRequest('42', {
      newPage: { title: 'About', slug: 'about', layout: [] },
    })
    await duplicatePageToTenant(req)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenant: mockTenant }),
      }),
    )
  })

  it('passes layout through clearLayoutRelationships', async () => {
    const req = buildRequest('42', {
      newPage: {
        title: 'About',
        slug: 'about',
        layout: [{ blockType: 'singleBlogPost', post: 123, backgroundColor: 'red' }],
      },
    })
    await duplicatePageToTenant(req)
    const layout = mockCreate.mock.calls[0][0].data.layout
    expect(layout[0]).not.toHaveProperty('post')
    expect(layout[0]).toHaveProperty('backgroundColor', 'red')
  })

  // A kept block id collides with the source page's row, since block ids are primary keys
  it('gives every block a page layout offers a new id', async () => {
    const slugs = layoutBlockSlugs(Pages.fields)
    expect(slugs).toContain('observationsWidget')

    const req = buildRequest('42', {
      newPage: {
        title: 'About',
        slug: 'about',
        layout: slugs.map((blockType) => ({ blockType, id: `${blockType}-row` })),
      },
    })
    await duplicatePageToTenant(req)
    const layout: unknown[] = mockCreate.mock.calls[0][0].data.layout
    expect(layout).toHaveLength(slugs.length)
    layout.forEach((block) => expect(block).not.toHaveProperty('id'))
  })

  it("drops the Observations Widget's zones, which belong to the source center", async () => {
    const req = buildRequest('42', {
      newPage: {
        title: 'About',
        slug: 'about',
        layout: [
          { blockType: 'observationsWidget', dateRange: 'pastWeek', zones: ['Stevens Pass'] },
        ],
      },
    })
    await duplicatePageToTenant(req)
    const layout = mockCreate.mock.calls[0][0].data.layout
    expect(layout[0]).not.toHaveProperty('zones')
    expect(layout[0]).toHaveProperty('dateRange', 'pastWeek')
  })

  it('falls back to empty layout when newPage.layout is absent', async () => {
    const req = buildRequest('42', { newPage: { title: 'About', slug: 'about' } })
    await duplicatePageToTenant(req)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ layout: [] }) }),
    )
  })

  it('looks up the tenant using tenantSlug from route param', async () => {
    const req = buildRequest('tac', {
      newPage: { title: 'About', slug: 'about', layout: [] },
    })
    await duplicatePageToTenant(req)
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'tenants',
        where: { slug: { equals: 'tac' } },
      }),
    )
  })
})
