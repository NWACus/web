const mockFind = jest.fn()
const mockLogError = jest.fn()

// Pass the callback through so the tests exercise the read, not Next's cache. The cache wraps the
// read at import, before any variable here exists, so its options are read back off the mock.
jest.mock('next/cache', () => ({ unstable_cache: jest.fn((cb: () => unknown) => cb) }))

jest.mock('payload', () => ({
  getPayload: () => Promise.resolve({ find: mockFind, logger: { error: mockLogError } }),
}))

// The real config pulls in the whole Payload runtime; the query is mocked, so it only needs to exist.
jest.mock('../../src/payload.config', () => ({ __esModule: true, default: {} }))

// Import the handler after the mocks are registered (jest hoists the mocks above imports).
import { GET } from '@/app/api/glossary/route'
import { unstable_cache } from 'next/cache'

// Read before the config's mock reset clears the call made at import.
const cacheOptions = jest.mocked(unstable_cache).mock.calls[0]?.[2]

describe('GET /api/glossary', () => {
  beforeEach(() => {
    mockFind.mockReset()
    mockLogError.mockReset()
  })

  it('serves the term list, tagged so a term edit purges it, and briefly cacheable at the edge', async () => {
    mockFind.mockResolvedValue({
      docs: [
        { term: 'Cornice', aliases: null, definition: 'Overhanging snow.', link: '' },
        { term: 'Slab', aliases: ['slabs'], definition: 'Cohesive snow.', link: 'https://a.org/' },
      ],
    })

    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      { term: 'Cornice', aliases: [], definition: 'Overhanging snow.', link: null },
      { term: 'Slab', aliases: ['slabs'], definition: 'Cohesive snow.', link: 'https://a.org/' },
    ])
    expect(cacheOptions?.tags).toEqual(['glossary'])
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60')
  })

  it('answers 503, uncached and logged, when the terms cannot be read', async () => {
    mockFind.mockRejectedValue(new Error('database unavailable'))

    const response = await GET()
    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(mockLogError).toHaveBeenCalled()
  })

  it('refuses an empty read rather than caching it, since only a term edit would clear it', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    const response = await GET()
    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})
