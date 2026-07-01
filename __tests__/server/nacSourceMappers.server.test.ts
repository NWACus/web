import { ProductType } from '@/services/nac/model/forecast'
import { mapV2ForecastResult, mapV2Warning, mapV2Weather } from '@/services/nac/sources/v2/mappers'
import {
  forecastResultSchema,
  warningResultSchema,
  weatherSchema,
} from '@/services/nac/types/forecastSchemas'
import inlineWeather from './fixtures/inline-weather.json'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'
import nwacForecastSummary from './fixtures/nwac-forecast.json'
import nwacWarning from './fixtures/nwac-warning.json'
import sacWeather from './fixtures/sac-weather.json'

describe('mapV2ForecastResult', () => {
  it('maps a v2 active forecast into the model, preserving danger and problems', () => {
    const wire = forecastResultSchema.parse(nwacForecastActive)
    const model = mapV2ForecastResult(wire)

    expect(model.product_type).toBe(ProductType.Forecast)
    if (model.product_type === ProductType.Forecast) {
      expect(model.danger.length).toBeGreaterThan(0)
      expect(model.forecast_avalanche_problems.length).toBeGreaterThan(0)
      expect(model.avalanche_center.id).toBe('NWAC')
    }
    // For v2 the model is shape-identical to the parsed wire response.
    expect(model).toEqual(wire)
  })

  it('maps a v2 off-season summary into the model (no danger/problems)', () => {
    const wire = forecastResultSchema.parse(nwacForecastSummary)
    const model = mapV2ForecastResult(wire)

    expect(model.product_type).toBe(ProductType.Summary)
    expect(model.avalanche_center.id).toBe('NWAC')
    expect(model).not.toHaveProperty('danger')
    expect(model).not.toHaveProperty('forecast_avalanche_problems')
    expect(model).toEqual(wire)
  })
})

describe('mapV2Warning', () => {
  it('collapses the v2 null-object (no active warning) to null', () => {
    const wire = warningResultSchema.parse(nwacWarning)
    expect(mapV2Warning(wire)).toBeNull()
  })

  it('maps an active v2 warning into a warning product', () => {
    const wire = warningResultSchema.parse({
      id: 42,
      product_type: 'warning',
      published_time: '2026-01-01T00:00:00+00:00',
      expires_time: '2026-01-02T00:00:00+00:00',
      created_at: '2026-01-01T00:00:00+00:00',
      updated_at: null,
      reason: 'Heavy new snow and wind loading',
      affected_area: 'All zones above 4000 ft',
      bottom_line: 'Avalanche Warning in effect',
      hazard_discussion: '<p>Dangerous avalanche conditions.</p>',
      avalanche_center: {
        id: 'NWAC',
        name: 'Northwest Avalanche Center',
        url: 'https://nwac.us',
        city: 'Seattle',
        state: 'WA',
      },
    })

    const model = mapV2Warning(wire)
    expect(model).not.toBeNull()
    expect(model?.product_type).toBe(ProductType.Warning)
    expect(model?.bottom_line).toBe('Avalanche Warning in effect')
    expect(model?.affected_area).toBe('All zones above 4000 ft')
    expect(model?.avalanche_center.id).toBe('NWAC')
  })

  it('maps an active v2 watch into a watch product', () => {
    const wire = warningResultSchema.parse({
      id: 7,
      product_type: 'watch',
      published_time: '2026-01-01T00:00:00+00:00',
      expires_time: '2026-01-02T00:00:00+00:00',
      created_at: '2026-01-01T00:00:00+00:00',
      updated_at: null,
      reason: 'Incoming storm',
      affected_area: 'West slopes',
      bottom_line: 'Avalanche Watch',
      hazard_discussion: '<p>Conditions deteriorating.</p>',
      avalanche_center: {
        id: 'NWAC',
        name: 'Northwest Avalanche Center',
        url: 'https://nwac.us',
        city: 'Seattle',
        state: 'WA',
      },
    })

    const model = mapV2Warning(wire)
    expect(model?.product_type).toBe(ProductType.Watch)
  })
})

describe('mapV2Weather', () => {
  it('parses and maps a columns/rows weather product (SAC)', () => {
    const wire = weatherSchema.parse(sacWeather)
    const model = mapV2Weather(wire)

    expect(model.product_type).toBe(ProductType.Weather)
    expect(model.avalanche_center.id).toBe('SAC')
    expect(model.weather_data).toHaveLength(1)
    const table = model.weather_data[0]
    // Columns/rows format: has `columns`/`rows`, no `periods`.
    expect('periods' in table).toBe(false)
    expect('columns' in table).toBe(true)
    // For v2 the model is shape-identical to the parsed wire response.
    expect(model).toEqual(wire)
  })

  it('parses and maps an inline/periods weather product', () => {
    const wire = weatherSchema.parse(inlineWeather)
    const model = mapV2Weather(wire)

    expect(model.weather_data).toHaveLength(1)
    const table = model.weather_data[0]
    // Inline format: detected by a `periods` key.
    expect('periods' in table).toBe(true)
    if ('periods' in table) {
      expect(table.periods).toHaveLength(3)
      // A split-cell value (Snowfall) is a nested array of {label,value}.
      const snowfall = table.data.find((row) => row.field === 'Snowfall')
      expect(Array.isArray(snowfall?.values[0])).toBe(true)
    }
    expect(model).toEqual(wire)
  })
})
