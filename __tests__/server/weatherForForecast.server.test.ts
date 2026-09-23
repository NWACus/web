import { mapV2ForecastResult } from '@/services/nac/sources/v2/mappers'
import { forecastResultSchema } from '@/services/nac/types/forecastSchemas'
import snfacForecast from './fixtures/snfac-forecast.json'

const mockGetWeather = jest.fn()
const mockGetWeatherForDate = jest.fn()
const mockGetForecastDay = jest.fn()
const mockIsNwacWeatherEnabled = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getWeatherSource: () => ({
    getWeather: (...a: unknown[]) => mockGetWeather(...a),
    getWeatherForDate: (...a: unknown[]) => mockGetWeatherForDate(...a),
  }),
  getNwacWeatherSource: () => ({
    getForecastDay: (...a: unknown[]) => mockGetForecastDay(...a),
  }),
}))
jest.mock('../../src/services/nac/nac', () => ({
  isNwacWeatherEnabled: (...a: unknown[]) => mockIsNwacWeatherEnabled(...a),
}))

// Import after the mock is registered (jest hoists the mock above imports).
import {
  getWeatherForForecast,
  getWeatherSourcesForForecast,
  pointerlessWeatherDate,
} from '@/services/nac/weatherForForecast'

const base = mapV2ForecastResult(forecastResultSchema.parse(snfacForecast))
const TZ = 'America/Denver'

/** A pointerless forecast published at an instant; the shape the pre-2020 SNFAC archive has. */
function pointerless(publishedTime: string) {
  return { ...base, weather_data: null, published_time: publishedTime }
}

beforeEach(() => {
  mockGetWeather.mockReset()
  mockGetWeatherForDate.mockReset()
  mockGetForecastDay.mockReset()
  mockIsNwacWeatherEnabled.mockReset()
})

describe('pointerlessWeatherDate', () => {
  it('is null for any forecast that points at its weather', () => {
    expect(base.weather_data?.weather_product_id).toBeTruthy()
    expect(pointerlessWeatherDate('snfac', base, TZ)).toBeNull()
  })

  it('is the published day, in the center timezone, for an SNFAC forecast before 2020-05-01', () => {
    // 05:13 UTC is still the previous evening in Mountain time.
    expect(pointerlessWeatherDate('snfac', pointerless('2020-02-15T05:13:00+00:00'), TZ)).toBe(
      '2020-02-14',
    )
    expect(pointerlessWeatherDate('SNFAC', pointerless('2020-02-15T13:13:00+00:00'), TZ)).toBe(
      '2020-02-15',
    )
  })

  it('is null on or after the cutoff, when the pointer exists and a missing one means no weather', () => {
    expect(pointerlessWeatherDate('snfac', pointerless('2020-05-01T13:00:00+00:00'), TZ)).toBeNull()
    expect(pointerlessWeatherDate('snfac', pointerless('2026-04-05T11:13:00+00:00'), TZ)).toBeNull()
  })

  it('is null for every other center, whose archives never lacked the pointer', () => {
    expect(pointerlessWeatherDate('nwac', pointerless('2020-02-15T13:13:00+00:00'), TZ)).toBeNull()
    expect(pointerlessWeatherDate('sac', pointerless('2020-02-15T13:13:00+00:00'), TZ)).toBeNull()
  })

  it('is null for an unparseable published time rather than throwing', () => {
    expect(pointerlessWeatherDate('snfac', pointerless('not a date'), TZ)).toBeNull()
  })
})

describe('getWeatherForForecast', () => {
  it('fetches by id when the forecast points at its weather', async () => {
    mockGetWeather.mockResolvedValue({ id: 184526 })

    await expect(getWeatherForForecast('snfac', 2905, base, TZ)).resolves.toEqual({ id: 184526 })
    expect(mockGetWeather).toHaveBeenCalledWith(base.weather_data?.weather_product_id)
    expect(mockGetWeatherForDate).not.toHaveBeenCalled()
  })

  it('falls back to center + zone + date for the pointerless SNFAC archive (row F26)', async () => {
    mockGetWeatherForDate.mockResolvedValue({ id: 86657 })

    const forecast = pointerless('2020-02-15T13:13:00+00:00')
    await expect(getWeatherForForecast('snfac', 2905, forecast, TZ)).resolves.toEqual({ id: 86657 })
    expect(mockGetWeatherForDate).toHaveBeenCalledWith('snfac', 2905, '2020-02-15')
    expect(mockGetWeather).not.toHaveBeenCalled()
  })

  it('is null, without any lookup, for a pointerless forecast outside that archive', async () => {
    await expect(
      getWeatherForForecast('snfac', 2905, pointerless('2026-04-05T11:13:00+00:00'), TZ),
    ).resolves.toBeNull()
    await expect(
      getWeatherForForecast('nwac', 1, pointerless('2020-02-15T13:13:00+00:00'), TZ),
    ).resolves.toBeNull()
    expect(mockGetWeather).not.toHaveBeenCalled()
    expect(mockGetWeatherForDate).not.toHaveBeenCalled()
  })
})

describe('getWeatherSourcesForForecast', () => {
  it('uses the AFP product when there is one, and never asks about NWAC weather', async () => {
    mockGetWeather.mockResolvedValue({ id: 184526 })
    await expect(getWeatherSourcesForForecast('snfac', 2905, base, TZ)).resolves.toEqual({
      weather: { id: 184526 },
      nwacWeather: null,
    })
    expect(mockIsNwacWeatherEnabled).not.toHaveBeenCalled()
  })

  it('falls back to NWAC weather for the viewed date, narrowed to the zone', async () => {
    mockIsNwacWeatherEnabled.mockResolvedValue(true)
    const day = { serviceDate: '2026-01-10', issuances: [{ id: 1, zones: [{ id: 'olympics' }] }] }
    mockGetForecastDay.mockResolvedValue(day)
    const forecast = pointerless('2026-01-10T15:00:00+00:00')
    await expect(
      getWeatherSourcesForForecast('nwac', 1, forecast, TZ, '2026-01-10'),
    ).resolves.toEqual({
      weather: null,
      nwacWeather: day,
    })
    expect(mockGetForecastDay).toHaveBeenCalledWith({ date: '2026-01-10', zone: 1 })
  })

  it('asks nothing more of a center without NWAC weather', async () => {
    mockIsNwacWeatherEnabled.mockResolvedValue(false)
    const forecast = pointerless('2026-01-10T15:00:00+00:00')
    await expect(getWeatherSourcesForForecast('sac', 1, forecast, TZ)).resolves.toEqual({
      weather: null,
      nwacWeather: null,
    })
    expect(mockGetForecastDay).not.toHaveBeenCalled()
  })
})
