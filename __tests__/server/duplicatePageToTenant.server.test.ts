jest.mock('../../src/constants/defaults', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DEFAULT_BLOCKS: require('./fixtures/mockBlocks').DEFAULT_BLOCKS,
}))

jest.mock('../../src/blocks/NACMedia/config', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NACMediaBlock: require('./fixtures/mockBlocks').NACMediaBlock,
}))

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { duplicatePageToTenant } from '@/collections/Pages/endpoints/duplicatePageToTenant'
import type { Payload, PayloadRequest } from 'payload'
import { getPayload } from 'payload'

const mockFind = jest.fn()
const mockCreate = jest.fn()

const mockTenant = { id: 42, name: 'Test AC', slug: 'tac' }

beforeEach(() => {
  jest
    .mocked(getPayload)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .mockResolvedValue({ find: mockFind, create: mockCreate } as unknown as Payload)
  mockFind.mockReset().mockResolvedValue({ docs: [mockTenant] })
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

describe('duplicatePageToTenant', () => {
  it('creates the page as a draft', async () => {
    const req = buildRequest('42', {
      newPage: { title: 'About', slug: 'about', layout: [] },
    })
    await duplicatePageToTenant(req)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ draft: true }))
  })

  it('appends " - Copy" to the title and "-copy" to the slug', async () => {
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
