import { weatherTableForZone, zoneWeather } from '@/components/forecast/zoneWeather'
import {
  ProductStatus,
  ProductType,
  type InlineWeatherData,
  type Weather,
} from '@/services/nac/model/forecast'

function table(zoneId: string, zoneName: string): InlineWeatherData {
  return { zone_id: zoneId, zone_name: zoneName, periods: [], data: [] }
}

function weatherFixture(overrides: Partial<Weather> = {}): Weather {
  return {
    id: 9,
    product_type: ProductType.Weather,
    status: ProductStatus.Published,
    author: 'Test Forecaster',
    published_time: '2026-01-05T07:00:00-08:00',
    created_at: '2026-01-05T07:00:00-08:00',
    updated_at: null,
    weather_discussion: '<p>Warming through the week.</p>',
    weather_data: [],
    avalanche_center: {
      id: 'SAC',
      name: 'Sierra Avalanche Center',
      url: 'https://www.sierraavalanchecenter.org/',
      city: 'Truckee',
      state: 'CA',
    },
    forecast_zone: [],
    ...overrides,
  }
}

describe('weatherTableForZone', () => {
  const tables = [table('3', 'Galena Summit'), table('1', 'Banner Summit')]

  it('picks the table whose zone_id matches, wherever it sits', () => {
    expect(weatherTableForZone(tables, '1')).toBe(tables[1])
  })

  it('returns null rather than falling back to the first table', () => {
    expect(weatherTableForZone(tables, '2')).toBeNull()
  })

  it('matches on zone_id, not on the zone name', () => {
    expect(weatherTableForZone(tables, 'Banner Summit')).toBeNull()
  })

  it('returns null when the product has no tables', () => {
    expect(weatherTableForZone([], '1')).toBeNull()
  })
})

describe('zoneWeather', () => {
  it('is null without a weather product', () => {
    expect(zoneWeather(null, '1')).toBeNull()
    expect(zoneWeather(undefined, '1')).toBeNull()
  })

  it('keeps the discussion when no table is for this zone', () => {
    const weather = weatherFixture({ weather_data: [table('3', 'Galena Summit')] })
    expect(zoneWeather(weather, '1')).toEqual({
      table: null,
      discussion: '<p>Warming through the week.</p>',
    })
  })

  it('returns the zone’s table without a discussion', () => {
    const own = table('1', 'Banner Summit')
    const weather = weatherFixture({ weather_discussion: null, weather_data: [own] })
    expect(zoneWeather(weather, '1')).toEqual({ table: own, discussion: null })
  })

  it('is null when there is no table for this zone and the discussion is blank', () => {
    const weather = weatherFixture({
      weather_discussion: '  \n ',
      weather_data: [table('3', 'Galena Summit')],
    })
    expect(zoneWeather(weather, '1')).toBeNull()
  })
})
