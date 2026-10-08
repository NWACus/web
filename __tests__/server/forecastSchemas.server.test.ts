import {
  AvalancheProblemLocation,
  DangerLevel,
  ForecastPeriod,
  forecastResultSchema,
  mediaItemSchema,
  MediaType,
  ProductType,
  warningResultSchema,
} from '@/services/nac/types/forecastSchemas'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'
import nwacForecastSummary from './fixtures/nwac-forecast.json'
import nwacWarning from './fixtures/nwac-warning.json'
import sacForecast from './fixtures/sac-forecast.json'
import sacWarning from './fixtures/sac-warning.json'
import snfacForecast from './fixtures/snfac-forecast.json'
import snfacWarning from './fixtures/snfac-warning.json'

/**
 * Parse a fixture as a full forecast, asserting the product type narrowed, and check that every
 * avalanche problem's size came through as a number — several centers return string sizes on the
 * wire, which the schema transforms.
 */
function parseForecastWithNumericSizes(fixture: unknown) {
  const result = forecastResultSchema.parse(fixture)
  expect(result.product_type).toBe(ProductType.Forecast)
  if (result.product_type !== ProductType.Forecast) throw new Error('expected a forecast')

  expect(result.forecast_avalanche_problems.length).toBeGreaterThan(0)
  for (const problem of result.forecast_avalanche_problems) {
    for (const size of problem.size) {
      expect(typeof size).toBe('number')
    }
  }

  return result
}

describe('forecastResultSchema', () => {
  it('parses an active NWAC forecast with string-typed sizes', () => {
    const result = parseForecastWithNumericSizes(nwacForecastActive)

    expect(result.danger.length).toBeGreaterThan(0)
    expect(result.danger[0].valid_day).toBe(ForecastPeriod.Current)
  })

  it('parses an SAC forecast with string-typed sizes', () => {
    parseForecastWithNumericSizes(sacForecast)
  })

  it('parses an SNFAC forecast', () => {
    const result = forecastResultSchema.parse(snfacForecast)
    expect(result.product_type).toBe(ProductType.Forecast)
    if (result.product_type === ProductType.Forecast) {
      expect(result.forecast_avalanche_problems.length).toBeGreaterThan(0)
      expect(result.avalanche_center.id).toBe('SNFAC')
    }
  })

  it('parses an off-season NWAC summary product', () => {
    const result = forecastResultSchema.parse(nwacForecastSummary)
    expect(result.product_type).toBe(ProductType.Summary)
    // Summary products don't have danger or problems in their type
    expect(result.avalanche_center.id).toBe('NWAC')
  })

  it('preserves null danger levels as DangerLevel.None', () => {
    const result = forecastResultSchema.parse(nwacForecastActive)
    if (result.product_type === ProductType.Forecast) {
      for (const danger of result.danger) {
        expect(danger.lower).toBeGreaterThanOrEqual(DangerLevel.None)
        expect(danger.middle).toBeGreaterThanOrEqual(DangerLevel.None)
        expect(danger.upper).toBeGreaterThanOrEqual(DangerLevel.None)
      }
    }
  })

  it('parses forecast media items', () => {
    const result = forecastResultSchema.parse(sacForecast)
    if (result.product_type === ProductType.Forecast && result.media) {
      expect(result.media.length).toBeGreaterThan(0)
      for (const item of result.media) {
        expect(item.type).not.toBe(MediaType.Unknown)
      }
    }
  })
})

describe('forecastResultSchema with values upstream may add', () => {
  /** The active NWAC forecast with its first problem's fields overridden. */
  function parseFirstProblemWith(overrides: Record<string, unknown>) {
    const [first, ...rest] = nwacForecastActive.forecast_avalanche_problems
    const result = forecastResultSchema.parse({
      ...nwacForecastActive,
      forecast_avalanche_problems: [{ ...first, ...overrides }, ...rest],
    })
    if (result.product_type !== ProductType.Forecast) throw new Error('expected a forecast')
    return result.forecast_avalanche_problems[0]
  }

  it('keeps a problem whose type it does not know, with its name as sent (Forecast-80)', () => {
    const problem = parseFirstProblemWith({ avalanche_problem_id: 99, name: 'Snow Goblin' })

    expect(problem.avalanche_problem_id).toBe(99)
    expect(problem.name).toBe('Snow Goblin')
  })

  it('drops only the locations it does not know (Forecast-88)', () => {
    const problem = parseFirstProblemWith({
      location: ['north upper', 'north alpine', 'east middle', 42],
    })

    expect(problem.location).toEqual([
      AvalancheProblemLocation.NorthUpper,
      AvalancheProblemLocation.EastMiddle,
    ])
  })

  it('reads a likelihood it does not know as none (Forecast-96)', () => {
    expect(parseFirstProblemWith({ likelihood: 'improbable' }).likelihood).toBeNull()
    expect(parseFirstProblemWith({ likelihood: undefined }).likelihood).toBeNull()
  })

  it('drops non-numeric sizes and keeps the rest (Forecast-96)', () => {
    expect(parseFirstProblemWith({ size: ['1', 'big', 2.5, null] }).size).toEqual([1, 2.5])
    expect(parseFirstProblemWith({ size: ['huge'] }).size).toEqual([])
  })
})

describe('warningResultSchema', () => {
  it('parses a null NWAC warning (no active warning)', () => {
    const result = warningResultSchema.parse(nwacWarning)
    expect(result.avalanche_center).toBeNull()
    expect(result.published_time).toBeNull()
  })

  it('parses a null SAC warning', () => {
    const result = warningResultSchema.parse(sacWarning)
    expect(result.avalanche_center).toBeNull()
  })

  it('parses a null SNFAC warning', () => {
    const result = warningResultSchema.parse(snfacWarning)
    expect(result.avalanche_center).toBeNull()
  })
})

describe('mediaItemSchema', () => {
  it('parses an image media item', () => {
    const item = {
      id: 123,
      type: 'image',
      url: {
        large: 'https://example.com/large.jpg',
        medium: 'https://example.com/medium.jpg',
        original: 'https://example.com/original.jpg',
        thumbnail: 'https://example.com/thumb.jpg',
      },
      caption: 'Test caption',
    }
    const result = mediaItemSchema.parse(item)
    expect(result.type).toBe(MediaType.Image)
  })

  it('parses a video media item with external link', () => {
    const item = {
      id: 456,
      type: 'video',
      url: {
        external_link: 'https://youtube.com/watch?v=abc',
        external_type: 'video',
      },
      caption: 'Video caption',
    }
    const result = mediaItemSchema.parse(item)
    expect(result.type).toBe(MediaType.Video)
  })

  it('parses a PDF media item', () => {
    const item = {
      type: 'pdf',
      url: {
        original: 'https://example.com/doc.pdf',
      },
    }
    const result = mediaItemSchema.parse(item)
    expect(result.type).toBe(MediaType.PDF)
  })

  it('falls back to unknown for unrecognized media types', () => {
    const item = {
      type: 'hologram',
      url: 'https://example.com/holo',
    }
    const result = mediaItemSchema.parse(item)
    expect(result.type).toBe(MediaType.Unknown)
  })

  it('parses an empty media item', () => {
    const item = { type: '', url: '', caption: '' }
    const result = mediaItemSchema.parse(item)
    expect(result.type).toBe(MediaType.None)
  })

  it('parses a null media item', () => {
    const item = { type: null, url: null, caption: '', title: '' }
    const result = mediaItemSchema.parse(item)
    expect(result.type).toBeNull()
  })
})
