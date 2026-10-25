jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: async () => true,
}))

const mockFetchProductById = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  fetchProductById: (...a: unknown[]) => mockFetchProductById(...a),
  getAvalancheCenterMetadata: () => mockGetMetadata(),
}))
const mockGetMetadata = jest.fn(async () => ({
  timezone: 'America/Los_Angeles',
  zones: [
    { id: 1645, url: 'https://nwac.us/avalanche-forecast/#/olympics' },
    { id: 1646, url: 'https://nwac.us/avalanche-forecast/#/stevens-pass' },
    { id: 9000, url: 'https://nwac.us/avalanche-forecast/' },
  ],
}))

const mockResolveDatedZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveDatedZoneFromSlug: (...a: unknown[]) => mockResolveDatedZone(...a),
}))

import { GET } from '@/app/api/[center]/forecast-address/route'
import { NextRequest } from 'next/server'

const ZONES: Record<string, number> = { olympics: 1645, 'stevens-pass': 1646 }

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 123,
    // 7 pm PST on Jan 4: valid on the 5th, by the noon rule.
    published_time: '2026-01-05T03:00:00+00:00',
    updated_at: '2026-01-05T03:00:00+00:00',
    avalanche_center: { id: 'NWAC' },
    forecast_zone: [
      { id: 1645, zone_id: '1' },
      { id: 1646, zone_id: '2' },
    ],
    ...overrides,
  }
}

async function addressFor(query: string, center = 'nwac') {
  const res = await GET(new NextRequest(`http://x/api/${center}/forecast-address${query}`), {
    params: Promise.resolve({ center }),
  })
  return { res, body: await res.json() }
}

beforeEach(() => {
  mockFetchProductById.mockReset()
  mockFetchProductById.mockResolvedValue(product())
  mockResolveDatedZone.mockReset()
  mockResolveDatedZone.mockImplementation(async (_center: string, slug: string) =>
    ZONES[slug] ? { slug, active: true, zone: { id: ZONES[slug] } } : null,
  )
})

// Forecast-244
describe('GET /api/[center]/forecast-address', () => {
  it("answers the product's dated address in the link's zone, and holds it", async () => {
    const { res, body } = await addressFor('?id=123&zone=2')

    expect(body).toEqual({ address: '/forecasts/avalanche/stevens-pass/2026-01-05' })
    expect(mockFetchProductById).toHaveBeenCalledWith(123)
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=86400')
  })

  it("takes the product's first zone when the link's matches none", async () => {
    expect((await addressFor('?id=123&zone=99')).body.address).toBe(
      '/forecasts/avalanche/olympics/2026-01-05',
    )
  })

  it.each([
    ['an unknown id', null],
    ["another center's product", product({ avalanche_center: { id: 'SAC' } })],
    ['a stub the archive hides', product({ updated_at: null })],
    // A retired zone with no address of its own, like one sharing the center's bare URL.
    [
      'a zone the dated route cannot resolve',
      product({ forecast_zone: [{ id: 9000, zone_id: '9' }] }),
    ],
  ])('answers nothing for %s, briefly', async (_label, found) => {
    mockFetchProductById.mockResolvedValue(found)

    const { res, body } = await addressFor('?id=123&zone=1')

    expect(body).toEqual({ address: null })
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=300')
  })

  it('answers DVAC for NWAC, whose data it shares', async () => {
    expect((await addressFor('?id=123&zone=1', 'dvac')).body.address).toBe(
      '/forecasts/avalanche/olympics/2026-01-05',
    )
  })

  it('rejects a missing or malformed id before going upstream', async () => {
    expect((await addressFor('?zone=1')).res.status).toBe(400)
    expect((await addressFor('?id=12a&zone=1')).res.status).toBe(400)
    expect(mockFetchProductById).not.toHaveBeenCalled()
  })

  it('answers nothing, uncached, when upstream fails', async () => {
    mockGetMetadata.mockRejectedValueOnce(new Error('NAC down'))

    const { res, body } = await addressFor('?id=123&zone=1')

    expect(body).toEqual({ address: null })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
