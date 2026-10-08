import { nwacWeatherPageFingerprint } from '@/services/nac/forecastFingerprint'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import {
  CACHEABLE,
  STALE_ETAG,
  answer,
  expectIndeterminate,
} from '../helpers/freshnessRouteAnswers'
import fixture from './fixtures/nwac-weather-forecasts.json'

const mockRevalidateTag = jest.fn()
jest.mock('next/cache', () => ({ revalidateTag: (tag: string) => mockRevalidateTag(tag) }))

const mockReportIndeterminate = jest.fn()
jest.mock('../../src/utilities/freshnessTelemetry', () => ({
  reportIndeterminate: (...args: unknown[]) => mockReportIndeterminate(...args),
}))

const mockGetLatestFresh = jest.fn()
const mockGetLatest = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getNWACWeatherSource: () => ({
    getLatestFresh: (...a: unknown[]) => mockGetLatestFresh(...a),
    getLatest: (...a: unknown[]) => mockGetLatest(...a),
  }),
}))

// Avoid loading the real nac module (and payload) just for the timezone and the cache tag.
const mockGetAvalancheCenterMetadata = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: (...a: unknown[]) => mockGetAvalancheCenterMetadata(...a),
  nwacWeatherCacheTag: 'nwac-weather',
}))

// Import the handler after the mocks are registered (jest hoists the mocks above imports).
import { GET } from '@/app/api/[center]/nwac-weather-freshness/[fingerprint]/route'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('The fixture has no published day')
const [afternoon, morning] = day.issuances
const corrected = {
  ...day,
  issuances: [{ ...afternoon, synopsis: `${afternoon.synopsis} (corrected)` }, morning],
}
/** The afternoon issuance pulled, leaving the morning one. */
const withdrawn = { ...day, issuances: [morning] }
/** What a viewer rendered when today's forecast was `day`. */
const etag = nwacWeatherPageFingerprint(day)

/** Ask the endpoint on behalf of a viewer whose page rendered `fingerprint`. */
function check(fingerprint: string, center = 'nwac') {
  const url = `http://localhost/api/${center}/nwac-weather-freshness/${fingerprint}`
  return GET(new Request(url), { params: Promise.resolve({ center, fingerprint }) })
}

/** The common case: the shared cache holds `day`, and upstream agrees unless told otherwise. */
function upstreamAndCacheHold(fresh: unknown = day) {
  mockGetLatestFresh.mockResolvedValue(fresh)
  mockGetLatest.mockResolvedValue(day)
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-09-15T02:00:00Z') })
  mockRevalidateTag.mockClear()
  mockReportIndeterminate.mockClear()
  mockGetLatestFresh.mockReset()
  mockGetLatest.mockReset()
  mockGetAvalancheCenterMetadata.mockReset()
  mockGetAvalancheCenterMetadata.mockResolvedValue({ timezone: 'America/Los_Angeles' })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('nwac-weather-freshness route', () => {
  it('reports no change, cacheably, when the viewer already has today’s forecast', async () => {
    upstreamAndCacheHold()

    const res = await answer(await check(etag))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ changed: false })
    expect(res.cacheControl).toBe(CACHEABLE)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('treats yesterday afternoon’s forecast as current until the morning one is out', async () => {
    // 15:00 UTC on the 15th is the morning of the 15th in Seattle; the latest forecast is the 14th's.
    jest.setSystemTime(new Date('2026-09-15T15:00:00Z'))
    upstreamAndCacheHold()

    const res = await answer(await check(etag))

    expect(res.body).toEqual({ changed: false })
    expect(res.cacheControl).toBe(CACHEABLE)
  })

  it('reads the date in the center’s timezone: a forecast two days old is not current', async () => {
    // 08:00 UTC on the 16th is already the 16th in Seattle, so the 14th's forecast has lapsed.
    jest.setSystemTime(new Date('2026-09-16T08:00:00Z'))
    upstreamAndCacheHold()

    const res = await answer(await check(etag))

    expect(res.body).toEqual({ changed: true, etag: nwacWeatherPageFingerprint(null) })
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('reports a change, uncacheably, and purges when an issuance was corrected', async () => {
    upstreamAndCacheHold(corrected)

    const res = await answer(await check(etag))

    expect(res.body).toEqual({ changed: true, etag: nwacWeatherPageFingerprint(corrected) })
    expect(res.cacheControl).toBe('no-store')
    expect(mockRevalidateTag).toHaveBeenCalledWith('nwac-weather')
    expect(mockRevalidateTag).toHaveBeenCalledTimes(1)
  })

  it('reports and purges a withdrawn issuance', async () => {
    upstreamAndCacheHold(withdrawn)

    const res = await answer(await check(etag))

    expect(res.body).toEqual({ changed: true, etag: nwacWeatherPageFingerprint(withdrawn) })
    expect(mockRevalidateTag).toHaveBeenCalledWith('nwac-weather')
  })

  it('trusts a fresh "nothing published": the last issuance withdrawn is a change too', async () => {
    upstreamAndCacheHold(null)

    const res = await answer(await check(etag))

    expect(res.body).toEqual({ changed: true, etag: nwacWeatherPageFingerprint(null) })
    expect(mockRevalidateTag).toHaveBeenCalledWith('nwac-weather')
    expect(mockReportIndeterminate).not.toHaveBeenCalled()
  })

  it('reports and purges a first publish into a day that had nothing', async () => {
    mockGetLatestFresh.mockResolvedValue(day)
    mockGetLatest.mockResolvedValue(null)

    const res = await answer(await check(nwacWeatherPageFingerprint(null)))

    expect(res.body).toEqual({ changed: true, etag })
    expect(mockRevalidateTag).toHaveBeenCalledWith('nwac-weather')
  })

  it('answers "you’re current", cacheably, to a page that also has nothing published', async () => {
    mockGetLatestFresh.mockResolvedValue(null)
    mockGetLatest.mockResolvedValue(null)

    const res = await answer(await check(nwacWeatherPageFingerprint(null)))

    expect(res.body).toEqual({ changed: false })
    expect(res.cacheControl).toBe(CACHEABLE)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('refreshes a stale viewer without purging when the shared cache is already current', async () => {
    // A purge here would be caller-driven, which content addressing must not allow.
    upstreamAndCacheHold()

    const res = await answer(await check(STALE_ETAG))

    expect(res.body).toEqual({ changed: true, etag })
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('is indeterminate, and reports it, when the fresh read fails', async () => {
    mockGetLatestFresh.mockRejectedValue(new Error('upstream down'))
    mockGetLatest.mockResolvedValue(day)

    expectIndeterminate(await answer(await check(etag)), mockRevalidateTag)
    expect(mockReportIndeterminate).toHaveBeenCalledWith('nwac-weather-unreachable', 'nwac')
  })

  it('is indeterminate, not a 500, when the center’s timezone cannot be read', async () => {
    mockGetAvalancheCenterMetadata.mockRejectedValue(new Error('upstream down'))

    expectIndeterminate(await answer(await check(etag)), mockRevalidateTag)
    expect(mockGetLatestFresh).not.toHaveBeenCalled()
  })

  it('rejects a malformed fingerprint before going upstream', async () => {
    const res = await answer(await check('not-a-fingerprint'))

    expect(res.status).toBe(400)
    expect(mockGetAvalancheCenterMetadata).not.toHaveBeenCalled()
  })

  it('serves NWAC only', async () => {
    const res = await answer(await check(etag, 'sac'))

    expect(res.status).toBe(404)
    expect(res.cacheControl).toBe('no-store')
    expect(mockGetAvalancheCenterMetadata).not.toHaveBeenCalled()
  })
})
