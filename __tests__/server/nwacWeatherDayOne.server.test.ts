import { dayOneOf, dayOnePeriodKeys, hasRolledOver } from '@/services/nac/nwacWeatherDayOne'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import fixture from './fixtures/nwac-weather-forecasts.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')
// Both issued the 14th: the afternoon's run n1 (14th), d2 (15th) …; the morning's d1 (14th), n1, d2.
const [afternoon, morning] = day.issuances

describe('dayOneOf', () => {
  it('takes the night and the day from an afternoon forecast', () => {
    const dayOne = dayOneOf(afternoon, {
      validDate: '2026-09-15',
      publishedDate: '2026-09-14',
      live: true,
    })

    expect(dayOne).toEqual({ day: 'd2', night: 'n1', rollsOn: '2026-09-15' })
  })

  it('finds the same half-days in a morning issuance', () => {
    const dayOne = dayOneOf(morning, {
      validDate: '2026-09-15',
      publishedDate: '2026-09-14',
      live: true,
    })

    expect(dayOne).toEqual({ day: 'd2', night: 'n1', rollsOn: '2026-09-15' })
  })

  it('has no night in a morning forecast written on its own day', () => {
    const dayOne = dayOneOf(morning, {
      validDate: '2026-09-14',
      publishedDate: '2026-09-14',
      live: false,
    })

    expect(dayOne).toEqual({ day: 'd1', night: null, rollsOn: null })
  })

  it('never rolls a past forecast over', () => {
    const dayOne = dayOneOf(afternoon, {
      validDate: '2026-09-15',
      publishedDate: '2026-09-14',
      live: false,
    })

    expect(dayOne).toEqual({ day: 'd2', night: 'n1', rollsOn: null })
  })

  it("is null for an issuance that doesn't forecast the day", () => {
    const dates = { validDate: '2026-09-14', publishedDate: '2026-09-14', live: true }

    expect(dayOneOf(afternoon, dates)).toBeNull()
  })
})

describe('dayOnePeriodKeys', () => {
  const dayOne = { day: 'd2', night: 'n1', rollsOn: '2026-09-15' }

  it('shows 24 hours on the afternoon the forecast is published', () => {
    expect(dayOnePeriodKeys(dayOne, '2026-09-14')).toEqual(['n1', 'd2'])
  })

  it('shows the 12-hour day from midnight', () => {
    expect(hasRolledOver(dayOne, '2026-09-15')).toBe(true)
    expect(dayOnePeriodKeys(dayOne, '2026-09-15')).toEqual(['d2'])
  })

  it('shows the day alone for a forecast with no night, in the morning', () => {
    const morningForecast = { day: 'd1', night: null, rollsOn: '2026-09-14' }

    expect(dayOnePeriodKeys(morningForecast, '2026-09-14')).toEqual(['d1'])
  })

  it('holds a past forecast at what it published', () => {
    const past = { day: 'd2', night: 'n1', rollsOn: null }

    expect(dayOnePeriodKeys(past, '2026-10-01')).toEqual(['n1', 'd2'])
  })
})
