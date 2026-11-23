import type { NWACWeatherForecastDay } from '@/services/nac/model/nwacWeather'
import { currentNWACWeatherDay, isPastNWACWeatherDate } from '@/services/nac/nwacWeatherCurrent'

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

describe('isPastNWACWeatherDate', () => {
  it('is not past for today', () => {
    expect(isPastNWACWeatherDate('2026-09-15', dayOf('2026-09-15'), '2026-09-15')).toBe(false)
  })

  it('is not past for yesterday while yesterday’s is still the current forecast', () => {
    expect(isPastNWACWeatherDate('2026-09-14', dayOf('2026-09-14'), '2026-09-15')).toBe(false)
  })

  it('is past for yesterday once today’s is issued, and for anything older', () => {
    expect(isPastNWACWeatherDate('2026-09-14', dayOf('2026-09-15'), '2026-09-15')).toBe(true)
    expect(isPastNWACWeatherDate('2026-09-10', dayOf('2026-09-14'), '2026-09-15')).toBe(true)
  })

  it('is past for any earlier date when nothing is current', () => {
    expect(isPastNWACWeatherDate('2026-09-14', null, '2026-09-15')).toBe(true)
  })
})
