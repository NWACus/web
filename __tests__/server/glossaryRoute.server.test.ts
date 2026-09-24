const mockGetTerms = jest.fn()
jest.mock('../../src/services/glossary/glossaryCache', () => ({
  getCachedGlossaryTerms: () => mockGetTerms(),
}))

// Import the handler after the mock is registered (jest hoists the mock above imports).
import { GET } from '@/app/api/glossary/route'

describe('GET /api/glossary', () => {
  beforeEach(() => mockGetTerms.mockReset())

  it('serves the cached term list, cacheable briefly at the edge', async () => {
    const terms = [{ term: 'Cornice', aliases: [], definition: 'Overhanging snow.', link: null }]
    mockGetTerms.mockResolvedValue(terms)

    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(terms)
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60')
  })

  it('answers 503, uncached, when the terms cannot be read', async () => {
    mockGetTerms.mockRejectedValue(new Error('database unavailable'))

    const response = await GET()
    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})
