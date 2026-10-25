const mockFetchProductArchive = jest.fn()
const mockGetMetadata = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: (...a: unknown[]) => mockGetMetadata(...a),
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

// `redirect` and `notFound` throw in Next; here they throw something the test can read.
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
  notFound: () => {
    throw new Error('notFound')
  },
}))

import Page from '@/app/(frontend)/[center]/forecasts/avalanche/[zone]/[date]/widget/page'

const ZONE_ID = 2905
const SLUG = 'soldier-&-wood-river-valley-mtns'

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
    forecast_zone: [{ id: ZONE_ID, zone_id: '4' }],
  }
}

// Newest first. 6 pm MDT publishes: each is valid the next day and expires the evening after.
const ARCHIVE = [
  row(184531, '2026-04-05T00:00:00+00:00', '2026-04-06T00:00:00+00:00'),
  row(184530, '2026-04-04T00:00:00+00:00', '2026-04-05T00:00:00+00:00'),
]

function handOver(date: string, zone = encodeURIComponent(SLUG)) {
  return Page({ params: Promise.resolve({ center: 'snfac', zone, date }) })
}

beforeEach(() => {
  mockResolveZone.mockReset()
  mockResolveZone.mockResolvedValue({ slug: SLUG, zone: { id: ZONE_ID, zone_id: '4' } })
  mockGetMetadata.mockReset()
  mockGetMetadata.mockResolvedValue({ timezone: 'America/Boise' })
  mockFetchProductArchive.mockReset()
  mockFetchProductArchive.mockResolvedValue(ARCHIVE)
  mockGetForecastFresh.mockReset()
  mockGetForecastFresh.mockResolvedValue({ id: 184531 })
})

// Forecast-242
describe('the widget hand-over page for a dated address', () => {
  it("sends the live product's own date to the zone page, not the widget's archived view", async () => {
    await expect(handOver('2026-04-05')).rejects.toThrow(`redirect:/forecasts/avalanche/${SLUG}`)
    await expect(handOver('2026-04-05')).rejects.not.toThrow('#')
  })

  it("opens an earlier day's product in the widget's archive", async () => {
    await expect(handOver('2026-04-04')).rejects.toThrow(
      `redirect:/forecasts/avalanche/${SLUG}#/forecast/4/184530`,
    )
  })

  it('keeps the archived address when the live product cannot be read', async () => {
    mockGetForecastFresh.mockRejectedValue(new Error('NAC down'))

    await expect(handOver('2026-04-05')).rejects.toThrow(
      `redirect:/forecasts/avalanche/${SLUG}#/forecast/4/184531`,
    )
  })

  it('lands on the zone page when the zone list cannot be read', async () => {
    mockGetMetadata.mockRejectedValue(new Error('NAC down'))

    await expect(handOver('2026-04-04')).rejects.toThrow(`redirect:/forecasts/avalanche/${SLUG}`)
  })

  it('404s an impossible date or an unknown zone', async () => {
    await expect(handOver('2026-02-30')).rejects.toThrow('notFound')
    mockResolveZone.mockResolvedValue(null)
    await expect(handOver('2026-04-04', 'nowhere')).rejects.toThrow('notFound')
  })
})
