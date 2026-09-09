import { getCachedHomePage } from '@/utilities/getCachedHomePage'

const mockFind = jest.fn()

// Pass the callback through so the tests exercise the query, not Next's cache.
let cacheOptions: { tags?: string[]; revalidate?: number | false } | undefined

jest.mock('next/cache', () => ({
  unstable_cache: (cb: () => unknown, _keyParts: string[], options: Record<string, unknown>) => {
    cacheOptions = options
    return cb
  },
}))

jest.mock('payload', () => ({
  getPayload: () => Promise.resolve({ find: mockFind }),
}))

// The real config pulls in the whole Payload runtime; the query is mocked, so it only needs to exist.
jest.mock('../../src/payload.config', () => ({ __esModule: true, default: {} }))

describe('utilities: getCachedHomePage', () => {
  beforeEach(() => {
    mockFind.mockReset()
    cacheOptions = undefined
  })

  it('returns the home page for the tenant', async () => {
    const homePage = { id: 4, tenant: { id: 2, slug: 'nwac' }, layout: [] }
    mockFind.mockResolvedValue({ docs: [homePage] })

    await expect(getCachedHomePage('nwac')()).resolves.toBe(homePage)
  })

  it('throws instead of resolving undefined when no published home page matches', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await expect(getCachedHomePage('nwac')()).rejects.toThrow(
      'No published home page found for tenant "nwac"',
    )
  })

  it('throws when no draft home page matches', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await expect(getCachedHomePage('nwac', true)()).rejects.toThrow(
      'No home page found for tenant "nwac"',
    )
  })

  it('filters to published documents only when not in draft mode', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 4 }] })

    await getCachedHomePage('nwac')()

    const { where, draft } = mockFind.mock.calls[0][0]
    expect(draft).toBe(false)
    expect(where.and).toHaveLength(2)
    expect(where.and[0]).toEqual({ 'tenant.slug': { equals: 'nwac' } })
  })

  it('skips the published filter in draft mode', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 4 }] })

    await getCachedHomePage('nwac', true)()

    const { where, draft } = mockFind.mock.calls[0][0]
    expect(draft).toBe(true)
    expect(where.and).toEqual([{ 'tenant.slug': { equals: 'nwac' } }])
  })

  it('tags the entry so revalidateHomePage can clear it', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 4 }] })

    await getCachedHomePage('nwac')()

    expect(cacheOptions?.tags).toEqual(['homePage', 'homePage-nwac'])
  })
})
