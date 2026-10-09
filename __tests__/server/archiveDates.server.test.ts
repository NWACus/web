import { parseISO } from 'date-fns'

import {
  buildZoneArchiveDates,
  currentElevationDanger,
  findCoveringProductDate,
  findProductIdForDate,
  forecastCalendarStart,
  forecastPickerSettings,
  parseArchiveWindowQuery,
  validDateForProduct,
  type ArchiveProductSummary,
} from '@/services/nac/archiveDates'

const TZ = 'America/Los_Angeles'

function item(
  partial: Partial<ArchiveProductSummary> & Pick<ArchiveProductSummary, 'id'>,
): ArchiveProductSummary {
  return {
    product_type: 'forecast',
    published_time: '2026-01-10T02:30:00+00:00',
    danger_rating: 2,
    danger_level_text: 'moderate',
    current_danger: { upper: 2, middle: 2, lower: 1 },
    author: 'Forecaster',
    expires_time: null,
    updated_at: '2026-01-10T02:30:00+00:00',
    forecast_zone: [{ id: 1646 }],
    ...partial,
  }
}

describe('validDateForProduct', () => {
  it('treats an evening-published forecast as the next local day (noon cutover)', () => {
    // 2026-04-19T01:30Z = 2026-04-18 18:30 PDT → valid for 2026-04-19
    expect(validDateForProduct('2026-04-19T01:30:00+00:00', TZ)).toBe('2026-04-19')
  })

  it('keeps a morning-published product on the same local day', () => {
    // 2026-04-19T16:00Z = 2026-04-19 09:00 PDT → valid for 2026-04-19
    expect(validDateForProduct('2026-04-19T16:00:00+00:00', TZ)).toBe('2026-04-19')
  })

  it('uses the center timezone, not the server timezone, for the cutover', () => {
    // 2026-01-10T02:30Z = 2026-01-09 18:30 PST → valid for 2026-01-10
    expect(validDateForProduct('2026-01-10T02:30:00+00:00', TZ)).toBe('2026-01-10')
  })

  it('returns null for an unparseable timestamp', () => {
    expect(validDateForProduct('not-a-date', TZ)).toBeNull()
  })
})

describe('buildZoneArchiveDates', () => {
  it('keeps only renderable products that cover the zone', () => {
    const items: ArchiveProductSummary[] = [
      item({ id: 1, published_time: '2026-04-19T01:30:00+00:00' }),
      item({ id: 2, product_type: 'synopsis', published_time: '2026-04-18T01:30:00+00:00' }),
      item({
        id: 3,
        published_time: '2026-04-17T01:30:00+00:00',
        forecast_zone: [{ id: 9999 }],
      }),
      item({
        id: 4,
        product_type: 'summary',
        published_time: '2026-04-16T01:30:00+00:00',
        forecast_zone: [{ id: 1645 }, { id: 1646 }],
      }),
    ]

    const dates = buildZoneArchiveDates(items, 1646, TZ)

    // synopsis (id 2) and the other-zone product (id 3) are excluded.
    expect(dates.map((d) => d.productId)).toEqual([1, 4])
    expect(dates.find((d) => d.productId === 4)?.productType).toBe('summary')
  })

  it('skips stub products with a null updated_at, so their dates neither show nor resolve', () => {
    const items: ArchiveProductSummary[] = [
      item({ id: 20, published_time: '2026-04-19T01:30:00+00:00' }),
      item({ id: 21, published_time: '2026-04-18T01:30:00+00:00', updated_at: null }),
    ]

    const dates = buildZoneArchiveDates(items, 1646, TZ)

    expect(dates.map((d) => d.date)).toEqual(['2026-04-19'])
    expect(findProductIdForDate(dates, '2026-04-18')).toBeNull()
  })

  it('does not let a later stub displace a real product on the same date', () => {
    const items: ArchiveProductSummary[] = [
      item({ id: 30, published_time: '2026-02-01T02:00:00+00:00' }),
      item({ id: 31, published_time: '2026-02-01T05:00:00+00:00', updated_at: null }),
    ]

    expect(buildZoneArchiveDates(items, 1646, TZ).map((d) => d.productId)).toEqual([30])
  })

  it('collapses same-date products to the most recently published', () => {
    const items: ArchiveProductSummary[] = [
      item({ id: 10, published_time: '2026-02-01T02:00:00+00:00', danger_rating: 1 }), // 2026-01-31 18:00 PST → 2026-02-01
      item({
        id: 11,
        published_time: '2026-02-01T05:00:00+00:00', // 2026-01-31 21:00 PST → 2026-02-01 (later)
        danger_rating: 3,
        danger_level_text: 'considerable',
        current_danger: { upper: 3, middle: 3, lower: 2 },
      }),
    ]

    const dates = buildZoneArchiveDates(items, 1646, TZ)

    expect(dates).toHaveLength(1)
    // The later publication wins, and its danger is carried for coloring and the day preview.
    expect(dates[0]).toEqual({
      date: '2026-02-01',
      productId: 11,
      productType: 'forecast',
      dangerRating: 3,
      dangerLevelText: 'considerable',
      danger: { upper: 3, middle: 3, lower: 2 },
      expiresTime: null,
    })
  })

  it('sorts newest date first', () => {
    const items: ArchiveProductSummary[] = [
      item({ id: 20, published_time: '2026-01-05T02:30:00+00:00' }),
      item({ id: 21, published_time: '2026-01-08T02:30:00+00:00' }),
      item({ id: 22, published_time: '2026-01-06T02:30:00+00:00' }),
    ]

    const dates = buildZoneArchiveDates(items, 1646, TZ)

    expect(dates.map((d) => d.date)).toEqual(['2026-01-08', '2026-01-06', '2026-01-05'])
  })
})

describe('currentElevationDanger', () => {
  it('picks the current day, not the outlook', () => {
    const danger = [
      { upper: 3, middle: 2, lower: 1, valid_day: 'tomorrow' },
      { upper: 2, middle: null, lower: 1, valid_day: 'current' },
    ]
    expect(currentElevationDanger(danger)).toEqual({ upper: 2, middle: null, lower: 1 })
  })

  it('is null when the product carries no current entry', () => {
    expect(currentElevationDanger([])).toBeNull()
    expect(currentElevationDanger(null)).toBeNull()
    expect(currentElevationDanger([{ upper: 2, valid_day: 'tomorrow' }])).toBeNull()
  })
})

describe('findProductIdForDate', () => {
  const day = {
    productType: 'forecast',
    dangerRating: 2,
    dangerLevelText: null,
    danger: null,
    expiresTime: null,
  }
  const dates = [
    { ...day, date: '2026-01-08', productId: 21 },
    { ...day, date: '2026-01-06', productId: 22 },
  ]

  it('resolves a known date to its product id', () => {
    expect(findProductIdForDate(dates, '2026-01-06')).toBe(22)
  })

  it('returns null for a date with no product', () => {
    expect(findProductIdForDate(dates, '2026-01-07')).toBeNull()
  })
})

describe('findCoveringProductDate', () => {
  // Boise is UTC-6 in April, so a day there starts at 06:00Z.
  const BOISE = 'America/Boise'
  const day = (date: string, expiresTime: string | null) => ({
    date,
    productId: Number(date.replaceAll('-', '')),
    productType: 'summary',
    dangerRating: -1,
    dangerLevelText: null,
    danger: null,
    expiresTime,
  })
  // Newest first, as buildZoneArchiveDates returns them.
  const dates = [
    day('2026-04-06', '2026-04-10T18:00:00+00:00'),
    day('2026-04-05', '2026-04-06T10:00:00+00:00'),
  ]

  it('finds the earlier product still valid when the day began', () => {
    expect(findCoveringProductDate(dates, '2026-04-08', BOISE)).toBe('2026-04-06')
    // 2026-04-10 begins at 06:00Z, before the 18:00Z expiry.
    expect(findCoveringProductDate(dates, '2026-04-10', BOISE)).toBe('2026-04-06')
  })

  it('finds nothing once the covering product expired before the day began', () => {
    expect(findCoveringProductDate(dates, '2026-04-11', BOISE)).toBeNull()
  })

  it('finds nothing in a gap no product covers', () => {
    const gap = [day('2026-03-20', '2026-03-21T10:00:00+00:00')]
    expect(findCoveringProductDate(gap, '2026-03-25', BOISE)).toBeNull()
  })

  it('takes the latest of several products that cover the day', () => {
    const several = [
      day('2026-04-07', '2026-04-12T18:00:00+00:00'),
      day('2026-04-06', '2026-04-12T18:00:00+00:00'),
    ]
    expect(findCoveringProductDate(several, '2026-04-09', BOISE)).toBe('2026-04-07')
  })

  it('keeps a day that has a product of its own', () => {
    expect(findCoveringProductDate(dates, '2026-04-05', BOISE)).toBe('2026-04-05')
  })

  it('reads the day in the center timezone, not UTC', () => {
    // Expires 2026-04-08 05:00Z: still the evening of the 7th in Boise, so the 8th isn't covered.
    const early = [day('2026-04-06', '2026-04-08T05:00:00+00:00')]
    expect(findCoveringProductDate(early, '2026-04-08', BOISE)).toBeNull()
    expect(findCoveringProductDate(early, '2026-04-08', 'UTC')).toBe('2026-04-06')
  })

  it('treats an unknown or unparseable expiry as covering nothing', () => {
    const unknown = [day('2026-04-06', null), day('2026-04-05', 'soon')]
    expect(findCoveringProductDate(unknown, '2026-04-07', BOISE)).toBeNull()
  })
})

describe('parseArchiveWindowQuery', () => {
  it('accepts a well-formed window', () => {
    expect(parseArchiveWindowQuery('west-slopes-north', '2026-02-01', '2026-02-28')).toEqual({
      zoneSlug: 'west-slopes-north',
      from: '2026-02-01',
      to: '2026-02-28',
    })
  })

  it('accepts a single-day window', () => {
    expect(parseArchiveWindowQuery('zone', '2026-02-01', '2026-02-01')).not.toBeNull()
  })

  it.each([
    ['a missing zone', null, '2026-02-01', '2026-02-28'],
    ['an empty zone', '', '2026-02-01', '2026-02-28'],
    ['a missing from', 'zone', null, '2026-02-28'],
    ['a missing to', 'zone', '2026-02-01', null],
  ])('rejects %s', (_label, zone, from, to) => {
    expect(parseArchiveWindowQuery(zone, from, to)).toBeNull()
  })

  it.each([
    ['a non-date from', 'zone', '01-02-2026', '2026-02-28'],
    ['a non-date to', 'zone', '2026-02-01', 'yesterday'],
    ['a short year', 'zone', '26-02-01', '2026-02-28'],
    ['a timestamp rather than a date', 'zone', '2026-02-01T00:00:00Z', '2026-02-28'],
  ])('rejects %s', (_label, zone, from, to) => {
    expect(parseArchiveWindowQuery(zone, from, to)).toBeNull()
  })

  it('rejects a window that runs backwards', () => {
    expect(parseArchiveWindowQuery('zone', '2026-03-01', '2026-02-01')).toBeNull()
  })

  it('accepts the longest month the date picker asks for', () => {
    expect(parseArchiveWindowQuery('zone', '2026-01-01', '2026-01-31')).not.toBeNull()
  })

  it('rejects a window longer than two months', () => {
    expect(parseArchiveWindowQuery('zone', '2020-01-01', '2026-01-01')).toBeNull()
  })
})

describe('forecastCalendarStart', () => {
  it('opens on September 1 of the season before start_year', () => {
    // start_year is a season's ending year: 2020 is the 2019–20 season.
    expect(forecastCalendarStart(2020)).toBe('2019-09-01')
  })

  it('falls back to September 1, 2019 when start_year is unset', () => {
    expect(forecastCalendarStart(undefined)).toBe('2019-09-01')
  })

  it('is a plain calendar day, so the client parses it as local midnight', () => {
    const start = parseISO(forecastCalendarStart(2013))
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2012, 8, 1])
  })
})

describe('forecastPickerSettings', () => {
  const zone = (status: string) => ({ status })

  it('reads the calendar start from the forecast widget config', () => {
    const settings = forecastPickerSettings({
      widget_config: { forecast: { start_year: 2025 } },
      zones: [zone('active')],
    })
    expect(settings.calendarStart).toBe('2024-09-01')
  })

  it('names the zone only when the center has more than one active zone', () => {
    const single = { widget_config: {}, zones: [zone('active'), zone('disabled')] }
    const several = { widget_config: {}, zones: [zone('active'), zone('active')] }

    expect(forecastPickerSettings(single).showZoneName).toBe(false)
    expect(forecastPickerSettings(several).showZoneName).toBe(true)
  })
})
