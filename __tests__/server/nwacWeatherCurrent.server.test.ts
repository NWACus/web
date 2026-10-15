import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'
import { currentNWACWeatherDay } from '@/services/nac/nwacWeatherCurrent'

const dayOf = (serviceDate: string): NWACWeatherForecastDay => ({ serviceDate, issuances: [] })

describe('currentNWACWeatherDay', () => {
  it('shows today’s forecast', () => {
    const today = dayOf('2026-09-15')
    expect(currentNWACWeatherDay(today, '2026-09-15')).toBe(today)
  })

  it('shows yesterday’s until today’s is issued, across a month boundary too', () => {
    const yesterday = dayOf('2026-09-30')
    expect(currentNWACWeatherDay(yesterday, '2026-10-01')).toBe(yesterday)
  })

  it('shows nothing when the latest forecast is older than yesterday', () => {
    expect(currentNWACWeatherDay(dayOf('2026-09-13'), '2026-09-15')).toBeNull()
    expect(currentNWACWeatherDay(dayOf('2026-04-20'), '2026-10-01')).toBeNull()
  })

  it('shows nothing when nothing has been published', () => {
    expect(currentNWACWeatherDay(null, '2026-09-15')).toBeNull()
  })
})
