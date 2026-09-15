import { bottomLineDangerLevel, highestDangerLevel } from '@/components/forecast/zoneCardDanger'
import {
  DangerLevel,
  ForecastPeriod,
  ProductType,
  type ForecastResult,
} from '@/services/nac/model/forecast'
import { mapV2ForecastResult } from '@/services/nac/sources/v2/mappers'
import { forecastResultSchema } from '@/services/nac/types/forecastSchemas'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'
import nwacForecastSummary from './fixtures/nwac-forecast.json'

const parseFixture = (fixture: unknown) => mapV2ForecastResult(forecastResultSchema.parse(fixture))

/** A real mapped forecast, narrowed so tests can vary its danger array. */
const baseForecast = () => {
  const result = parseFixture(nwacForecastActive)
  if (result.product_type !== ProductType.Forecast) {
    throw new Error('nwac-forecast-active fixture is expected to be a full forecast')
  }
  return result
}

const withTodaysDanger = (
  upper: DangerLevel,
  middle: DangerLevel,
  lower: DangerLevel,
): ForecastResult => ({
  ...baseForecast(),
  danger: [{ valid_day: ForecastPeriod.Current, upper, middle, lower }],
})

describe('highestDangerLevel', () => {
  it('takes the highest of the three bands', () => {
    expect(
      highestDangerLevel({
        upper: DangerLevel.Considerable,
        middle: DangerLevel.Moderate,
        lower: DangerLevel.Low,
      }),
    ).toBe(DangerLevel.Considerable)
  })

  it('does not assume the upper band is the highest', () => {
    expect(
      highestDangerLevel({
        upper: DangerLevel.Low,
        middle: DangerLevel.High,
        lower: DangerLevel.Moderate,
      }),
    ).toBe(DangerLevel.High)
  })

  it('falls back to None for an out-of-range rating', () => {
    // GeneralInformation is -1, which has no slot in the ordered lookup.
    expect(
      highestDangerLevel({
        upper: DangerLevel.GeneralInformation,
        middle: DangerLevel.GeneralInformation,
        lower: DangerLevel.GeneralInformation,
      }),
    ).toBe(DangerLevel.None)
  })
})

describe('bottomLineDangerLevel', () => {
  it('uses today’s highest band', () => {
    expect(
      bottomLineDangerLevel(
        withTodaysDanger(DangerLevel.High, DangerLevel.Moderate, DangerLevel.Low),
      ),
    ).toBe(DangerLevel.High)
  })

  it('ignores tomorrow’s ratings', () => {
    const forecast: ForecastResult = {
      ...baseForecast(),
      danger: [
        {
          valid_day: ForecastPeriod.Current,
          upper: DangerLevel.Low,
          middle: DangerLevel.Low,
          lower: DangerLevel.Low,
        },
        {
          valid_day: ForecastPeriod.Tomorrow,
          upper: DangerLevel.Extreme,
          middle: DangerLevel.Extreme,
          lower: DangerLevel.Extreme,
        },
      ],
    }
    expect(bottomLineDangerLevel(forecast)).toBe(DangerLevel.Low)
  })

  it('is None when there is no forecast', () => {
    expect(bottomLineDangerLevel(null)).toBe(DangerLevel.None)
  })

  it('is None for a summary, which carries no danger ratings', () => {
    const summary = parseFixture(nwacForecastSummary)
    expect(summary.product_type).toBe(ProductType.Summary)
    expect(bottomLineDangerLevel(summary)).toBe(DangerLevel.None)
  })

  it('is None when today has no entry', () => {
    const forecast: ForecastResult = {
      ...baseForecast(),
      danger: [
        {
          valid_day: ForecastPeriod.Tomorrow,
          upper: DangerLevel.High,
          middle: DangerLevel.High,
          lower: DangerLevel.High,
        },
      ],
    }
    expect(bottomLineDangerLevel(forecast)).toBe(DangerLevel.None)
  })
})
