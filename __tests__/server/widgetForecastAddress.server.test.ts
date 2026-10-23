jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: async () => ({ timezone: 'America/Los_Angeles' }),
  fetchProductArchive: (...a: unknown[]) => mockFetchProductArchive(...a),
}))

const mockResolveZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveZoneFromSlug: (...a: unknown[]) => mockResolveZone(...a),
}))

const mockGetForecastFresh = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getForecastSource: () => ({ getForecastFresh: (...a: unknown[]) => mockGetForecastFresh(...a) }),
}))

const mockFetchProductArchive = jest.fn()

import { GET } from '@/app/api/[center]/widget-forecast-address/route'
import { NextRequest } from 'next/server'

const ZONE_ID = 1648

/** An archive row for the zone, as `fetchProductArchive` returns it. */
function row(id: number, published: string, expires: string) {
  return {
    id,
    product_type: 'forecast',
    published_time: published,
    expires_time: expires,
    created_at: published,
    updated_at: published,
    danger_rating: 2,
    danger_level_text: null,
    danger: [],
    forecast_zone: [{ id: ZONE_ID, zone_id: '3' }],
  }
}

// Newest first. 6 pm PDT publishes: each is valid the next day and expires the evening after.
const ARCHIVE = [
  row(165010, '2026-10-14T01:00:00+00:00', '2026-10-15T01:00:00+00:00'),
  row(165011, '2026-10-13T01:00:00+00:00', '2026-10-14T01:00:00+00:00'),
]

function handOver(query: string, center = 'nwac') {
  return GET(new NextRequest(`http://x/api/${center}/widget-forecast-address${query}`), {
    params: Promise.resolve({ center }),
  })
}

beforeEach(() => {
  mockResolveZone.mockReset()
  mockResolveZone.mockResolvedValue({
    slug: 'snoqualmie-pass',
    zone: { id: ZONE_ID, zone_id: '3' },
  })
  mockFetchProductArchive.mockReset()
  mockFetchProductArchive.mockResolvedValue(ARCHIVE)
  mockGetForecastFresh.mockReset()
  mockGetForecastFresh.mockResolvedValue({ id: 165010 })
})

// Forecast-242
describe('GET /api/[center]/widget-forecast-address', () => {
  it("sends the live product's own date to the zone page, not the widget's archived view", async () => {
    const res = await handOver('?zone=snoqualmie-pass&date=2026-10-14')

    expect(res.status).toBe(307)
    expect(res.headers.get('Location')).toBe('/forecasts/avalanche/snoqualmie-pass')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=30')
  })

  it("opens an earlier day's product in the widget's archive", async () => {
    const res = await handOver('?zone=snoqualmie-pass&date=2026-10-13')

    expect(res.headers.get('Location')).toBe(
      '/forecasts/avalanche/snoqualmie-pass#/forecast/3/165011',
    )
  })

  it('keeps the archived address when the live product cannot be read', async () => {
    mockGetForecastFresh.mockRejectedValue(new Error('NAC down'))

    const res = await handOver('?zone=snoqualmie-pass&date=2026-10-14')

    expect(res.headers.get('Location')).toBe(
      '/forecasts/avalanche/snoqualmie-pass#/forecast/3/165010',
    )
  })

  it('rejects a malformed date, an unknown zone and an unknown center', async () => {
    expect((await handOver('?zone=snoqualmie-pass&date=2026-13-45')).status).toBe(400)
    mockResolveZone.mockResolvedValue(null)
    expect((await handOver('?zone=nowhere&date=2026-10-14')).status).toBe(404)
    expect((await handOver('?zone=snoqualmie-pass&date=2026-10-14', 'nope')).status).toBe(404)
  })
})
