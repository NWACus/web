jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: async () => true,
}))

const mockArchive = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: async () => ({
    timezone: 'America/Los_Angeles',
    widget_config: { forecast: { start_year: 2026 } },
  }),
  fetchProductArchiveOrThrow: (...a: unknown[]) => mockArchive(...a),
}))

const mockResolveZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveDatedZoneFromSlug: (...a: unknown[]) => mockResolveZone(...a),
}))

import { GET } from '@/app/api/[center]/forecast-archive/adjacent/route'
import { addDays, format } from 'date-fns'
import { NextRequest } from 'next/server'

const params = Promise.resolve({ center: 'nwac' })

function call(query: string) {
  return GET(new NextRequest(`http://x/api/nwac/forecast-archive/adjacent?${query}`), { params })
}

/** A morning forecast for zone 1, valid on the day it was published. */
function product(id: number, date: string) {
  return {
    id,
    product_type: 'forecast',
    published_time: `${date}T16:00:00+00:00`,
    danger_rating: 2,
    danger_level_text: 'moderate',
    current_danger: null,
    author: null,
    updated_at: `${date}T16:00:00+00:00`,
    forecast_zone: [{ id: 1 }],
  }
}

beforeEach(() => {
  mockResolveZone.mockResolvedValue({ slug: 'olympics', zone: { id: 1 } })
  // Upstream narrows by window, so answer only with the products inside it.
  const products = [product(1, '2025-09-02'), product(2, '2025-12-20'), product(3, '2026-01-05')]
  mockArchive.mockImplementation(async (_center: string, window: { from: string; to: string }) =>
    products.filter((p) => {
      const day = p.published_time.slice(0, 10)
      return day >= window.from && day <= window.to
    }),
  )
})

describe('GET /api/[center]/forecast-archive/adjacent', () => {
  it('answers the previous forecast date, cached as immutable', async () => {
    const res = await call('zone=olympics&date=2026-01-05&dir=older')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ date: '2025-12-20' })
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=1800')
  })

  it('stops at the calendar start, so an older product before it is not offered', async () => {
    // start_year 2026 opens the calendar on 2025-09-01; the 2025-09-02 product is the first.
    const res = await call('zone=olympics&date=2025-09-02&dir=older')

    expect(await res.json()).toEqual({ date: null })
  })

  it('answers the next forecast date on a short cache, since a newer one can still publish', async () => {
    const res = await call('zone=olympics&date=2025-09-02&dir=newer')

    expect(await res.json()).toEqual({ date: '2025-12-20' })
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=300')
  })

  it('400s a malformed query', async () => {
    expect((await call('zone=olympics&date=yesterday&dir=older')).status).toBe(400)
  })

  it.each([
    // Each would walk hundreds of empty months, one cold upstream read apiece.
    ['far in the future', 'date=2090-01-01&dir=older'],
    ['far in the past', 'date=1900-01-01&dir=newer'],
    ['the day before the calendar start', 'date=2025-08-31&dir=older'],
    ['past tomorrow', `date=${format(addDays(new Date(), 2), 'yyyy-MM-dd')}&dir=newer`],
  ])('400s, uncached and without reading upstream, a date %s', async (_label, query) => {
    const res = await call(`zone=olympics&${query}`)

    expect([res.status, res.headers.get('Cache-Control')]).toEqual([400, 'no-store'])
    expect(await res.json()).toEqual({ error: 'Date outside the calendar' })
    expect([mockResolveZone, mockArchive].map((mock) => mock.mock.calls.length)).toEqual([0, 0])
  })

  it('accepts the calendar start itself', async () => {
    const res = await call('zone=olympics&date=2025-09-01&dir=newer')

    expect(await res.json()).toEqual({ date: '2025-09-02' })
  })

  it('404s a zone that is not one of the center’s', async () => {
    mockResolveZone.mockResolvedValue(null)
    expect((await call('zone=nowhere&date=2026-01-05&dir=older')).status).toBe(404)
  })

  it('502s, uncached, when the archive cannot be read', async () => {
    mockArchive.mockRejectedValue(new Error('NAC down'))

    const res = await call('zone=olympics&date=2026-01-05&dir=older')

    expect(res.status).toBe(502)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
