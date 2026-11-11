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

// The fixture is 2026-09-14: a morning issuance at 7 am PDT and an afternoon one at 3 pm PDT.
function dayOf(date: string) {
  return date === '2026-09-14' ? day : null
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-09-15T15:00:00Z') })
  mockGetDay.mockReset()
  mockGetDay.mockImplementation(async (date: string) => dayOf(date))
  mockGetAvalancheCenterMetadata.mockReset()
  mockGetAvalancheCenterMetadata.mockResolvedValue({ timezone: 'America/Los_Angeles' })
})

afterEach(() => {
  jest.useRealTimers()
})

async function issuanceTypes(query: string) {
  const body = await (await ask(query)).json()
  return body.day?.issuances.map((i: { type: string }) => i.type) ?? null
}

describe('nwac-weather-zone route', () => {
  it('reads the publish date and the day before it', async () => {
    await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)

    expect(mockGetDay).toHaveBeenCalledWith('2026-09-14', { historical: true })
    expect(mockGetDay).toHaveBeenCalledWith('2026-09-13', { historical: true })
  })

  it('reads today too while the forecast is in force, so a later issuance can show', async () => {
    await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)

    expect(mockGetDay).toHaveBeenCalledWith('2026-09-15', { historical: false })
  })

  it('picks the newest issuance published so far for a forecast in force', async () => {
    // 1 pm PDT the 14th, for the 15th, read on the 15th: the afternoon issuance came after it.
    expect(await issuanceTypes(`?zone=${OLYMPICS}&published=2026-09-14T20:00:00Z`)).toEqual([
      'afternoon',
    ])
    // Read at 2 pm PDT on the 14th, the afternoon issuance isn't out yet.
    jest.setSystemTime(new Date('2026-09-14T21:00:00Z'))
    expect(await issuanceTypes(`?zone=${OLYMPICS}&published=2026-09-14T20:00:00Z`)).toEqual([
      'morning',
    ])
  })

  it('keeps a past forecast on the issuance it was written against, as nwac.us did', async () => {
    jest.setSystemTime(new Date('2026-09-20T15:00:00Z'))
    // 1 pm PDT: the morning issuance, though the afternoon one was out by its valid date.
    expect(await issuanceTypes(`?zone=${OLYMPICS}&published=2026-09-14T20:00:00Z`)).toEqual([
      'morning',
    ])
    // 6 pm PDT: the afternoon issuance.
    expect(await issuanceTypes(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)).toEqual([
      'afternoon',
    ])
  })

  it('answers with the 24 hours on show now and the next, from the issuance it picked', async () => {
    // 8 am PDT on the 15th.
    const body = await (await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)).json()

    expect(body.day.windows).toEqual([
      { startsAt: '2026-09-15T13:00:00.000Z', issuance: 0, periodKeys: ['d2', 'n2'] },
      { startsAt: '2026-09-16T01:00:00.000Z', issuance: 0, periodKeys: ['n2', 'd3'] },
    ])
  })

  it('finds nothing before the first issuance or more than a day after the last', async () => {
    // 6 am PDT on the 14th, before its morning issuance.
    expect(await issuanceTypes(`?zone=${OLYMPICS}&published=2026-09-14T13:00:00Z`)).toBeNull()
    // 4 pm PDT on the 15th: the 14th's afternoon issuance is 25 hours old.
    expect(await issuanceTypes(`?zone=${OLYMPICS}&published=2026-09-15T23:00:00Z`)).toBeNull()
  })

  it('caches a forecast in force briefly and one past its valid date long', async () => {
    // Published yesterday afternoon, valid today: a new issuance can still change it.
    const inForce = await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)
    expect(inForce.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600',
    )
    jest.setSystemTime(new Date('2026-09-16T15:00:00Z'))
    const past = await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)
    expect(past.headers.get('Cache-Control')).toBe(
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

  it("sanitizes the picked issuance's authored HTML", async () => {
    if (!day) throw new Error('fixture should map to a forecast day')
    const [first, ...rest] = day.issuances
    const dirty = {
      ...day,
      issuances: [{ ...first, synopsis: '<p>Rain</p><script>alert(1)</script>' }, ...rest],
    }
    mockGetDay.mockImplementation(async (date: string) => (date === '2026-09-14' ? dirty : null))

    const body = await (await ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)).json()

    expect(body.day.issuances).toHaveLength(1)
    expect(body.day.issuances[0].synopsis).toBe('<p>Rain</p>')
  })

  // The widget then says the forecast couldn't be loaded, not that none was issued, and nothing
  // caches the failure.
  it('fails rather than answering no day when upstream cannot be read', async () => {
    mockGetDay.mockRejectedValue(new Error('upstream down'))

    await expect(ask(`?zone=${OLYMPICS}&published=2026-09-15T01:00:00Z`)).rejects.toThrow(
      'upstream down',
    )
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
