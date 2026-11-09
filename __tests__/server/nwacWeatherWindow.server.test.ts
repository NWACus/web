import {
  heldSpan,
  nextSpan,
  spanAt,
  spanPeriodKeys,
  windowShowing,
} from '@/services/nac/nwacWeatherWindow'
import { mapV3NWACWeatherForecastDay } from '@/services/nac/sources/v3/nwacWeatherMappers'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'
import fixture from './fixtures/nwac-weather-forecasts.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')
// Both issued the 14th: the afternoon's run n1 (14th), d2 (15th) …; the morning's d1 (14th), n1, d2.
const [afternoon, morning] = day.issuances
const TZ = 'America/Los_Angeles'

describe('spanAt', () => {
  it('shows the day and the night after it from 6 am', () => {
    // 7 am PDT on the 14th.
    const span = spanAt(new Date('2026-09-14T14:00:00Z'), TZ)

    expect(span.halves).toEqual([
      { kind: 'day', date: '2026-09-14' },
      { kind: 'night', date: '2026-09-14' },
    ])
    expect(span.startsAt.toISOString()).toBe('2026-09-14T13:00:00.000Z')
    expect(span.endsAt.toISOString()).toBe('2026-09-15T01:00:00.000Z')
  })

  it('shows the night and the next day from 6 pm', () => {
    // 6 pm PDT on the 14th.
    const span = spanAt(new Date('2026-09-15T01:00:00Z'), TZ)

    expect(span.halves).toEqual([
      { kind: 'night', date: '2026-09-14' },
      { kind: 'day', date: '2026-09-15' },
    ])
  })

  it('keeps the night and the day through the small hours', () => {
    // 3 am PDT on the 15th.
    const span = spanAt(new Date('2026-09-15T10:00:00Z'), TZ)

    expect(span.halves[0]).toEqual({ kind: 'night', date: '2026-09-14' })
    expect(span.startsAt.toISOString()).toBe('2026-09-15T01:00:00.000Z')
    expect(span.endsAt.toISOString()).toBe('2026-09-15T13:00:00.000Z')
  })

  it('rolls at 6 am local in standard time too', () => {
    // 7 am PST on Nov 2.
    const span = spanAt(new Date('2026-11-02T15:00:00Z'), TZ)

    expect(span.startsAt.toISOString()).toBe('2026-11-02T14:00:00.000Z')
  })

  it('is followed by the next 12 hours on', () => {
    const next = nextSpan(spanAt(new Date('2026-09-14T14:00:00Z'), TZ), TZ)

    expect(next.halves).toEqual([
      { kind: 'night', date: '2026-09-14' },
      { kind: 'day', date: '2026-09-15' },
    ])
  })
})

describe('heldSpan', () => {
  it('holds a forecast issued the evening before to that night and its day', () => {
    const span = heldSpan(
      {
        validDate: '2026-09-15',
        publishedDate: '2026-09-14',
        published: new Date('2026-09-15T00:45:00Z'),
      },
      TZ,
    )

    expect(span.halves).toEqual([
      { kind: 'night', date: '2026-09-14' },
      { kind: 'day', date: '2026-09-15' },
    ])
  })

  it('holds one published on its valid date to the span it was published in', () => {
    const span = heldSpan(
      {
        validDate: '2026-09-14',
        publishedDate: '2026-09-14',
        published: new Date('2026-09-14T15:00:00Z'),
      },
      TZ,
    )

    expect(span.halves[0]).toEqual({ kind: 'day', date: '2026-09-14' })
  })
})

describe('spanPeriodKeys', () => {
  const daytime = spanAt(new Date('2026-09-14T14:00:00Z'), TZ)

  it("finds the span's periods", () => {
    expect(spanPeriodKeys(morning, daytime)).toEqual(['d1', 'n1'])
  })

  it("is null for an issuance that doesn't forecast both", () => {
    expect(spanPeriodKeys(afternoon, daytime)).toBeNull()
  })
})

describe('windowShowing', () => {
  const windows = [
    { startsAt: '2026-09-14T13:00:00.000Z' },
    { startsAt: '2026-09-15T01:00:00.000Z' },
  ]

  it('shows the last window started', () => {
    expect(windowShowing(windows, new Date('2026-09-15T02:00:00Z'))).toBe(windows[1])
  })

  it('shows the first before any has started', () => {
    expect(windowShowing(windows, new Date('2026-09-14T12:00:00Z'))).toBe(windows[0])
  })
})
