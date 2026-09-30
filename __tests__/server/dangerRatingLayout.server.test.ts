import { dangerHeadings, isNoRatingDay } from '@/components/forecast/dangerRatingLayout'
import {
  DangerLevel,
  ForecastPeriod,
  type AvalancheDangerForecast,
} from '@/services/nac/model/forecast'

const dangerDay = (
  upper: DangerLevel,
  middle: DangerLevel,
  lower: DangerLevel,
): AvalancheDangerForecast => ({
  valid_day: ForecastPeriod.Current,
  upper,
  middle,
  lower,
})

describe('dangerHeadings', () => {
  it('falls back to Today/Tomorrow for the compact card, which passes no published time', () => {
    expect(dangerHeadings(undefined, 'America/Los_Angeles')).toEqual({
      dated: false,
      today: 'Today',
      tomorrow: 'Tomorrow',
    })
  })

  it('uses real valid dates when a published time is supplied', () => {
    // 08:00 local is before the noon cutover, so the product is for the same day.
    expect(dangerHeadings('2026-04-14T08:00:00-07:00', 'America/Los_Angeles')).toEqual({
      dated: true,
      today: 'Tuesday, April 14, 2026',
      tomorrow: 'Wednesday, April 15, 2026',
    })
  })

  it('applies the noon cutover, so an evening product is the next day’s', () => {
    expect(dangerHeadings('2026-04-14T18:00:00-07:00', 'America/Los_Angeles')).toMatchObject({
      today: 'Wednesday, April 15, 2026',
      tomorrow: 'Thursday, April 16, 2026',
    })
  })

  it('still reads as dated, with fallback labels, for an unparseable timestamp', () => {
    expect(dangerHeadings('not-a-date', 'America/Los_Angeles')).toEqual({
      dated: true,
      today: 'Today',
      tomorrow: 'Tomorrow',
    })
  })
})

describe('isNoRatingDay', () => {
  it('is true when every band is unrated', () => {
    expect(isNoRatingDay(dangerDay(DangerLevel.None, DangerLevel.None, DangerLevel.None))).toBe(
      true,
    )
  })

  it('is false when any band carries a rating', () => {
    expect(isNoRatingDay(dangerDay(DangerLevel.Moderate, DangerLevel.None, DangerLevel.None))).toBe(
      false,
    )
    expect(isNoRatingDay(dangerDay(DangerLevel.None, DangerLevel.Low, DangerLevel.None))).toBe(
      false,
    )
    expect(isNoRatingDay(dangerDay(DangerLevel.None, DangerLevel.None, DangerLevel.High))).toBe(
      false,
    )
  })

  it('is false when there is no forecast for the day at all', () => {
    expect(isNoRatingDay(undefined)).toBe(false)
  })

  it('does not treat general information as "no rating"', () => {
    expect(
      isNoRatingDay(
        dangerDay(
          DangerLevel.GeneralInformation,
          DangerLevel.GeneralInformation,
          DangerLevel.GeneralInformation,
        ),
      ),
    ).toBe(false)
  })
})
