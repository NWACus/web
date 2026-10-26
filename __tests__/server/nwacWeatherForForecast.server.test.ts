import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import fixture from './fixtures/nwac-weather-forecasts.json'

const mockGetDay = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getNWACWeatherSource: () => ({ getDay: (...a: unknown[]) => mockGetDay(...a) }),
}))

import { getNWACWeatherForForecast } from '@/services/nac/nwacWeatherForForecast'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
const OLYMPICS = 1645
const TZ = 'America/Los_Angeles'

// The fixture is 2026-09-14: a morning issuance at 7 am PDT and an afternoon one at 3 pm PDT.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-09-15T15:00:00Z') })
  mockGetDay.mockReset()
  mockGetDay.mockImplementation(async (date: string) => (date === '2026-09-14' ? day : null))
})

afterEach(() => {
  jest.useRealTimers()
})

// The choice itself is covered through the widget's route, nwacWeatherZoneRoute.server.test.ts.
describe('getNWACWeatherForForecast', () => {
  it('picks the issuance the forecast was written against', async () => {
    // 6 pm PDT: the afternoon issuance.
    const found = await getNWACWeatherForForecast('nwac', OLYMPICS, '2026-09-15T01:00:00Z', TZ)

    expect(found?.issuances.map((i) => i.type)).toEqual(['afternoon'])
  })

  it('reads nothing for any other center', async () => {
    expect(await getNWACWeatherForForecast('sac', OLYMPICS, '2026-09-15T01:00:00Z', TZ)).toBeNull()
    expect(mockGetDay).not.toHaveBeenCalled()
  })

  it('throws when a day cannot be read, rather than answering none', async () => {
    mockGetDay.mockRejectedValue(new Error('upstream down'))

    await expect(
      getNWACWeatherForForecast('nwac', OLYMPICS, '2026-09-15T01:00:00Z', TZ),
    ).rejects.toThrow('upstream down')
  })

  // Without the 15th, the 14th's afternoon issuance would stand in for the 15th's own.
  it('throws when only one of the two days can be read', async () => {
    mockGetDay.mockImplementation(async (date: string) => {
      if (date === '2026-09-14') return day
      throw new Error('upstream down')
    })

    await expect(
      getNWACWeatherForForecast('nwac', OLYMPICS, '2026-09-15T13:00:00Z', TZ),
    ).rejects.toThrow('upstream down')
  })
})
