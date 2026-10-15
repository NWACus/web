jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: async () => true,
}))

jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: async () => ({ timezone: 'America/Boise' }),
}))

const mockResolveZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveZoneFromSlug: (...a: unknown[]) => mockResolveZone(...a),
}))

const mockGetForecastFresh = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getForecastSource: () => ({ getForecastFresh: (...a: unknown[]) => mockGetForecastFresh(...a) }),
}))

import { GET } from '@/app/api/[center]/forecast-current-date/[zone]/route'
import {
  currentForecastDateEndpoint,
  mayBeCurrentProductDate,
} from '@/services/nac/currentForecastDate'

describe('currentForecastDateEndpoint', () => {
  it('encodes the slug, so a zone name with `&` stays one path segment', () => {
    expect(currentForecastDateEndpoint('snfac', 'soldier-&-wood-river-valley-mtns')).toBe(
      '/api/snfac/forecast-current-date/soldier-%26-wood-river-valley-mtns',
    )
  })
})

describe('mayBeCurrentProductDate', () => {
  it('asks on the page for the live product’s date, or one newer', () => {
    expect(mayBeCurrentProductDate('2026-04-05', '2026-04-05', true)).toBe(true)
    // Rendered from a live read that trailed a fresh publish.
    expect(mayBeCurrentProductDate('2026-04-06', '2026-04-05', true)).toBe(true)
  })

  it('asks when the live date could not be read at render', () => {
    expect(mayBeCurrentProductDate('2026-04-05', null, true)).toBe(true)
  })

  it('never asks on a date already behind the live product', () => {
    expect(mayBeCurrentProductDate('2026-04-04', '2026-04-05', true)).toBe(false)
  })

  it('never asks for a retired zone, which has no live page', () => {
    expect(mayBeCurrentProductDate('2026-04-05', null, false)).toBe(false)
  })
})

describe('GET /api/[center]/forecast-current-date/[zone]', () => {
  const call = (zone: string) =>
    GET(new Request(`http://x/api/snfac/forecast-current-date/${zone}`), {
      params: Promise.resolve({ center: 'snfac', zone }),
    })

  beforeEach(() => {
    mockResolveZone.mockResolvedValue({ slug: 'banner-summit', zone: { id: 2907 } })
  })

  it('answers the live product’s valid date, edge-cached briefly', async () => {
    // 12:19Z is 06:19 in Boise: a morning forecast, valid the same day.
    mockGetForecastFresh.mockResolvedValue({ published_time: '2026-04-05T12:19:00+00:00' })

    const res = await call('banner-summit')

    expect(await res.json()).toEqual({ date: '2026-04-05' })
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=30')
    expect(mockGetForecastFresh).toHaveBeenCalledWith('snfac', 2907)
  })

  it('answers null when nothing is published, which keeps the reader where they are', async () => {
    mockGetForecastFresh.mockResolvedValue(null)

    expect(await (await call('banner-summit')).json()).toEqual({ date: null })
  })

  it('decodes the slug it is handed', async () => {
    mockGetForecastFresh.mockResolvedValue(null)

    await call('soldier-%26-wood-river-valley-mtns')

    expect(mockResolveZone).toHaveBeenCalledWith('snfac', 'soldier-&-wood-river-valley-mtns')
  })

  it('404s a zone that is not one of the center’s active zones', async () => {
    mockResolveZone.mockResolvedValue(null)

    expect((await call('whitefish-range')).status).toBe(404)
  })

  it('answers null, uncached, when the zone list cannot be read', async () => {
    mockResolveZone.mockRejectedValue(new Error('NAC down'))

    const res = await call('banner-summit')

    expect(await res.json()).toEqual({ date: null })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
