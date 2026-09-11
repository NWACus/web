import {
  availablePrintSections,
  forecastPrintFilename,
} from '@/components/forecast/forecastPrintSections'
import {
  AvalancheProblemLikelihood,
  AvalancheProblemName,
  AvalancheProblemSize,
  AvalancheProblemType,
  DangerLevel,
  ForecastPeriod,
  ProductStatus,
  ProductType,
  type AvalancheProblem,
  type Forecast,
  type Summary,
  type Weather,
} from '@/services/nac/model/forecast'

const center = {
  id: 'NWAC',
  name: 'Northwest Avalanche Center',
  url: 'https://nwac.us/',
  city: 'Seattle',
  state: 'WA',
}

function forecastFixture(overrides: Partial<Forecast> = {}): Forecast {
  return {
    id: 1,
    product_type: ProductType.Forecast,
    status: ProductStatus.Published,
    author: 'Dennis D’Amico',
    published_time: '2026-04-19T18:30:00-07:00',
    expires_time: '2026-04-20T18:30:00-07:00',
    created_at: '2026-04-19T18:30:00-07:00',
    updated_at: null,
    bottom_line: '<p>Watch for wind slab on leeward slopes.</p>',
    forecast_avalanche_problems: [],
    hazard_discussion: null,
    danger: [
      {
        valid_day: ForecastPeriod.Current,
        upper: DangerLevel.Considerable,
        middle: DangerLevel.Moderate,
        lower: DangerLevel.Low,
      },
    ],
    weather_data: null,
    media: null,
    avalanche_center: center,
    forecast_zone: [],
    ...overrides,
  }
}

function summaryFixture(overrides: Partial<Summary> = {}): Summary {
  const { danger: _danger, forecast_avalanche_problems: _problems, ...rest } = forecastFixture()

  return {
    ...rest,
    product_type: ProductType.Summary,
    expires_time: null,
    ...overrides,
  }
}

const weatherFixture: Weather = {
  id: 9,
  product_type: ProductType.Weather,
  status: ProductStatus.Published,
  author: 'Scott Savage',
  published_time: '2026-04-19T18:30:00-07:00',
  created_at: '2026-04-19T18:30:00-07:00',
  updated_at: null,
  weather_discussion: '<p>Warming through the week.</p>',
  weather_data: [],
  avalanche_center: center,
  forecast_zone: [],
}

// A single problem is enough — availability turns on the array being non-empty.
const problemFixture: AvalancheProblem = {
  id: 1,
  forecast_id: 1,
  rank: 1,
  avalanche_problem_id: AvalancheProblemType.StormSlab,
  name: AvalancheProblemName.StormSlab,
  likelihood: AvalancheProblemLikelihood.Possible,
  icon: 'storm-slab',
  location: [],
  size: [AvalancheProblemSize.Small, AvalancheProblemSize.Large],
  discussion: '',
  problem_description: '',
  media: { type: '', url: '', caption: '' },
}

describe('availablePrintSections', () => {
  it('offers bottom line and danger for a forecast, and nothing it has no content for', () => {
    expect(availablePrintSections(forecastFixture(), null)).toEqual(['bottomLine'])
  })

  it('offers avalanche problems only when the forecast has some', () => {
    expect(
      availablePrintSections(
        forecastFixture({ forecast_avalanche_problems: [problemFixture] }),
        null,
      ),
    ).toEqual(['bottomLine', 'problems'])
  })

  it('never offers avalanche problems for a summary, which carries none', () => {
    expect(availablePrintSections(summaryFixture(), null)).toEqual(['bottomLine'])
  })

  it('offers the discussion only when the product has one', () => {
    expect(
      availablePrintSections(forecastFixture({ hazard_discussion: null }), null),
    ).not.toContain('discussion')
    expect(
      availablePrintSections(forecastFixture({ hazard_discussion: '<p>Spring.</p>' }), null),
    ).toContain('discussion')
  })

  it('offers mountain weather only when a weather product was fetched', () => {
    // The legacy widget rendered this checkbox unconditionally, so centers that publish no
    // weather product got a checkbox that silently did nothing.
    expect(availablePrintSections(forecastFixture(), null)).not.toContain('weather')
    expect(availablePrintSections(forecastFixture(), weatherFixture)).toContain('weather')
  })

  it('still offers bottom line and danger for a forecast with an empty bottom line', () => {
    // A forecast always has danger ratings, which ride on this same checkbox.
    expect(availablePrintSections(forecastFixture({ bottom_line: null }), null)).toContain(
      'bottomLine',
    )
  })

  it('drops the bottom line checkbox on a summary with no bottom line, which has nothing to show', () => {
    expect(availablePrintSections(summaryFixture({ bottom_line: null }), null)).toEqual([])
  })

  it('returns sections in a stable, canonical order', () => {
    expect(
      availablePrintSections(
        forecastFixture({
          forecast_avalanche_problems: [problemFixture],
          hazard_discussion: '<p>Spring.</p>',
        }),
        weatherFixture,
      ),
    ).toEqual(['bottomLine', 'problems', 'discussion', 'weather'])
  })
})

describe('forecastPrintFilename', () => {
  it('names a forecast by center, zone, product and valid date', () => {
    expect(
      forecastPrintFilename({
        centerSlug: 'nwac',
        zoneName: 'Olympics',
        productType: ProductType.Forecast,
        validDate: '2026-04-20',
      }),
    ).toBe('nwac-olympics-avalanche-forecast-2026-04-20')
  })

  it('distinguishes a summary from a forecast', () => {
    expect(
      forecastPrintFilename({
        centerSlug: 'sac',
        zoneName: 'Central Sierra Nevada',
        productType: ProductType.Summary,
        validDate: '2026-05-01',
      }),
    ).toBe('sac-central-sierra-nevada-avalanche-information-2026-05-01')
  })

  it('slugifies zone names carrying punctuation, spaces and case', () => {
    expect(
      forecastPrintFilename({
        centerSlug: 'nwac',
        zoneName: 'Mt Hood / Salmon River Mtns.',
        productType: ProductType.Forecast,
        validDate: '2026-01-02',
      }),
    ).toBe('nwac-mt-hood-salmon-river-mtns-avalanche-forecast-2026-01-02')
  })

  it('omits the date rather than trailing a hyphen when none is known', () => {
    expect(
      forecastPrintFilename({
        centerSlug: 'nwac',
        zoneName: 'Olympics',
        productType: ProductType.Forecast,
        validDate: '',
      }),
    ).toBe('nwac-olympics-avalanche-forecast')
  })
})
