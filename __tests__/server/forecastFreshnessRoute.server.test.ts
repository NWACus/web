import { forecastFingerprint } from '@/services/nac/forecastFingerprint'
import { mapV2ForecastResult } from '@/services/nac/sources/v2/mappers'
import { forecastResultSchema } from '@/services/nac/types/forecastSchemas'
import { NextRequest } from 'next/server'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'

const mockRevalidateTag = jest.fn()
jest.mock('next/cache', () => ({ revalidateTag: (tag: string) => mockRevalidateTag(tag) }))

const mockResolveZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveZoneFromSlug: (...args: unknown[]) => mockResolveZone(...args),
}))

const mockGetForecastFresh = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getForecastSource: () => ({ getForecastFresh: (...a: unknown[]) => mockGetForecastFresh(...a) }),
}))

// Avoid loading the real nac module (and payload) just for the cache-tag helper.
jest.mock('../../src/services/nac/nac', () => ({
  forecastCacheTag: (centerId: string, zoneId: number) =>
    `forecast:${centerId === 'dvac' ? 'nwac' : centerId}:${zoneId}`,
}))

// Import the handler after the mocks are registered (jest hoists the mocks above imports).
import { GET } from '@/app/api/[center]/forecast-freshness/route'

const forecast = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))
const etag = forecastFingerprint(forecast)
const params = Promise.resolve({ center: 'nwac' })

function req(headers: Record<string, string> = {}, zone: string | null = 'west-slopes-north') {
  const url = zone
    ? `http://localhost/api/nwac/forecast-freshness?zone=${zone}`
    : `http://localhost/api/nwac/forecast-freshness`
  return new NextRequest(url, { headers })
}

beforeEach(() => {
  mockRevalidateTag.mockClear()
  mockResolveZone.mockReset()
  mockGetForecastFresh.mockReset()
  mockResolveZone.mockResolvedValue({ slug: 'west-slopes-north', zone: { id: 123, name: 'X' } })
})

describe('forecast-freshness route', () => {
  it('returns 304 without revalidating when the fingerprint matches', async () => {
    mockGetForecastFresh.mockResolvedValue(forecast)
    const res = await GET(req({ 'If-None-Match': etag }), { params })
    expect(res.status).toBe(304)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('returns 200 and revalidates the forecast tag when the forecast changed', async () => {
    mockGetForecastFresh.mockResolvedValue({ ...forecast, bottom_line: 'CORRECTED' })
    const res = await GET(req({ 'If-None-Match': etag }), { params })
    expect(res.status).toBe(200)
    expect(mockRevalidateTag).toHaveBeenCalledWith('forecast:nwac:123')
  })

  it('returns 200 and revalidates when the forecast was withdrawn (fresh is null)', async () => {
    mockGetForecastFresh.mockResolvedValue(null)
    const res = await GET(req({ 'If-None-Match': etag }), { params })
    expect(res.status).toBe(200)
    expect(mockRevalidateTag).toHaveBeenCalledWith('forecast:nwac:123')
  })

  it('always runs the fresh check even without an If-None-Match (no-skip invariant)', async () => {
    mockGetForecastFresh.mockResolvedValue(forecast)
    const res = await GET(req(), { params })
    expect(mockGetForecastFresh).toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  it('400s when the zone param is missing', async () => {
    const res = await GET(req({}, null), { params })
    expect(res.status).toBe(400)
    expect(mockGetForecastFresh).not.toHaveBeenCalled()
  })
})
