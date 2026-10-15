import { NextRequest } from 'next/server'

import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import fixture from './fixtures/nwac-weather-forecasts.json'

const mockGetDay = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getNWACWeatherSource: () => ({ getDay: (...a: unknown[]) => mockGetDay(...a) }),
}))

// Avoid loading the real nac module (and payload) just for the timezone.
const mockGetAvalancheCenterMetadata = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: (...a: unknown[]) => mockGetAvalancheCenterMetadata(...a),
}))

import { GET } from '@/app/api/[center]/nwac-weather-zone/route'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
const OLYMPICS = 1645

function ask(query: string, center = 'nwac') {
  const url = `http://localhost/api/${center}/nwac-weather-zone${query}`
  return GET(new NextRequest(url), { params: Promise.resolve({ center }) })
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-09-15T15:00:00Z') })
  mockGetDay.mockReset()
  mockGetDay.mockResolvedValue(day)
  mockGetAvalancheCenterMetadata.mockReset()
  mockGetAvalancheCenterMetadata.mockResolvedValue({ timezone: 'America/Los_Angeles' })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('nwac-weather-zone route', () => {
  it("reads the day an evening forecast is valid for, the next one, as today's", async () => {
    // 6 pm PDT on the 14th: past the noon cutover, so valid for the 15th.
    const res = await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)

    expect(res.status).toBe(200)
    expect(mockGetDay).toHaveBeenCalledWith('2026-09-15', { historical: false })
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600',
    )
  })

  it('reads a past forecast as historical, cached long', async () => {
    const res = await ask(`?zone=${OLYMPICS}&published=2026-09-01T15:00:00Z`)

    expect(mockGetDay).toHaveBeenCalledWith('2026-09-01', { historical: true })
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800',
    )
  })

  it('caches a past day with nothing for the zone briefly, not for a day', async () => {
    mockGetDay.mockResolvedValue(null)
    const res = await ask(`?zone=${OLYMPICS}&published=2026-09-01T15:00:00Z`)

    expect(await res.json()).toEqual({ day: null })
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600',
    )
  })

  it('keeps only the issuances covering the zone, their authored HTML sanitized', async () => {
    if (!day) throw new Error('fixture should map to a forecast day')
    const [first, ...rest] = day.issuances
    mockGetDay.mockResolvedValue({
      ...day,
      issuances: [{ ...first, synopsis: '<p>Rain</p><script>alert(1)</script>' }, ...rest],
    })

    const body = await (await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)).json()

    expect(body.day.issuances).toHaveLength(day.issuances.length)
    expect(body.day.issuances[0].synopsis).toBe('<p>Rain</p>')
  })

  it("answers no day for a zone none of the day's issuances covers", async () => {
    const body = await (await ask('?zone=999999&published=2026-09-15T01:00:00Z')).json()

    expect(body).toEqual({ day: null })
  })

  it('rejects a missing zone or published time before going upstream', async () => {
    expect((await ask('?published=2026-09-15T01:00:00Z')).status).toBe(400)
    expect((await ask(`?zone=${OLYMPICS}`)).status).toBe(400)
    expect((await ask(`?zone=${OLYMPICS}&published=yesterday`)).status).toBe(400)
    expect(mockGetDay).not.toHaveBeenCalled()
  })

  it('serves NWAC only', async () => {
    const res = await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`, 'sac')

    expect(res.status).toBe(404)
    expect(mockGetDay).not.toHaveBeenCalled()
  })
})
