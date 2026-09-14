import type { ArchiveProductSummary } from '@/services/nac/archiveDates'
import {
  applyArchiveFilters,
  archiveDangerLevel,
  archiveRowHref,
  buildArchiveRows,
  dangerCounts,
  paginateArchiveRows,
  resolveArchiveFilters,
  seasonLabel,
  seasonOfDate,
  seasonOptions,
  seasonWindow,
  todayInTimezone,
  type ArchiveQuery,
  type ArchiveRow,
  type ArchiveZone,
} from '@/services/nac/forecastArchive'

const TZ = 'America/Los_Angeles'

const ZONES: ArchiveZone[] = [
  { id: 1, slug: 'olympics', name: 'Olympics' },
  { id: 2, slug: 'west-slopes-north', name: 'West Slopes North' },
]

function item(
  partial: Partial<ArchiveProductSummary> & Pick<ArchiveProductSummary, 'id'>,
): ArchiveProductSummary {
  return {
    product_type: 'forecast',
    published_time: '2026-01-10T02:30:00+00:00',
    danger_rating: 2,
    author: 'Forecaster',
    updated_at: '2026-01-10T02:30:00+00:00',
    forecast_zone: [{ id: 1 }],
    ...partial,
  }
}

function query(partial: Partial<ArchiveQuery> = {}): ArchiveQuery {
  return { season: null, from: null, to: null, zone: [], danger: [], type: [], page: 1, ...partial }
}

const OPTIONS = { today: '2026-01-15', startSeason: 2020, zoneSlugs: ZONES.map((z) => z.slug) }

describe('seasons', () => {
  it('names a season by the year it ends in, turning over on September 1', () => {
    expect(seasonOfDate('2025-08-31')).toBe(2025)
    expect(seasonOfDate('2025-09-01')).toBe(2026)
    expect(seasonOfDate('2026-01-15')).toBe(2026)
  })

  it('spans September 1 to August 31', () => {
    expect(seasonWindow(2026)).toEqual({ from: '2025-09-01', to: '2026-08-31' })
  })

  it('labels the current season as such and the rest by their years', () => {
    expect(seasonLabel(2026, 2026)).toBe('Current Season')
    expect(seasonLabel(2024, 2026)).toBe('2023-2024 Season')
  })

  it('offers seasons newest first, back to the start season', () => {
    expect(seasonOptions(2026, 2024).map((o) => o.value)).toEqual([2026, 2025, 2024])
    expect(seasonOptions(2026, 2024)[0].label).toBe('Current Season')
  })

  it('still offers the current season when the start season lies in the future', () => {
    expect(seasonOptions(2026, 2030).map((o) => o.value)).toEqual([2026])
  })

  it("reads today's date off the center's clock", () => {
    // 2026-01-16T05:30Z is still the 15th in Los Angeles.
    const now = new Date('2026-01-16T05:30:00Z')
    expect(todayInTimezone(TZ, now)).toBe('2026-01-15')
    expect(todayInTimezone('UTC', now)).toBe('2026-01-16')
  })
})

describe('resolveArchiveFilters', () => {
  it('defaults to the current season from its first day through today, unfiltered', () => {
    const filters = resolveArchiveFilters(query(), OPTIONS)
    expect(filters).toMatchObject({
      season: 2026,
      currentSeason: 2026,
      window: { from: '2025-09-01', to: '2026-08-31' },
      from: '2025-09-01',
      to: '2026-01-15',
      defaultRange: { from: '2025-09-01', to: '2026-01-15' },
      isDateFiltered: false,
      zone: [],
      danger: [],
      type: [],
      page: 1,
      isFiltered: false,
    })
  })

  it('shows a past season whole', () => {
    const filters = resolveArchiveFilters(query({ season: 2024 }), OPTIONS)
    expect(filters).toMatchObject({
      season: 2024,
      from: '2023-09-01',
      to: '2024-08-31',
      isFiltered: true,
    })
  })

  it('falls back to the current season for a season outside the offered range', () => {
    expect(resolveArchiveFilters(query({ season: 2019 }), OPTIONS).season).toBe(2026)
    expect(resolveArchiveFilters(query({ season: 2030 }), OPTIONS).season).toBe(2026)
    expect(resolveArchiveFilters(query({ season: 2025.5 }), OPTIONS).season).toBe(2026)
  })

  it('keeps a well-formed range inside the season and marks the view filtered', () => {
    const filters = resolveArchiveFilters(query({ from: '2025-12-01', to: '2025-12-31' }), OPTIONS)
    expect(filters).toMatchObject({
      from: '2025-12-01',
      to: '2025-12-31',
      isDateFiltered: true,
      isFiltered: true,
    })
  })

  it('drops a malformed, out-of-season or reversed range', () => {
    expect(resolveArchiveFilters(query({ from: 'Dec 1' }), OPTIONS).from).toBe('2025-09-01')
    expect(resolveArchiveFilters(query({ from: '2024-12-01' }), OPTIONS).from).toBe('2025-09-01')
    expect(resolveArchiveFilters(query({ to: '2026-09-15' }), OPTIONS).to).toBe('2026-01-15')

    const reversed = resolveArchiveFilters(query({ from: '2026-01-10', to: '2025-12-01' }), OPTIONS)
    expect(reversed).toMatchObject({ from: '2025-09-01', to: '2026-01-15', isFiltered: false })
  })

  it('keeps only known zones, valid danger levels and listed product types, once each', () => {
    const filters = resolveArchiveFilters(
      query({
        zone: ['olympics', 'olympics', 'nowhere'],
        danger: [3, 3, 7, -1, 1.5, 0],
        type: ['forecast', 'weather', 'forecast'],
      }),
      OPTIONS,
    )
    expect(filters.zone).toEqual(['olympics'])
    expect(filters.danger).toEqual([0, 3])
    expect(filters.type).toEqual(['forecast'])
    expect(filters.isFiltered).toBe(true)
  })

  it('treats a page below one as the first', () => {
    expect(resolveArchiveFilters(query({ page: 0 }), OPTIONS).page).toBe(1)
    expect(resolveArchiveFilters(query({ page: -3 }), OPTIONS).page).toBe(1)
    expect(resolveArchiveFilters(query({ page: 4 }), OPTIONS).page).toBe(4)
  })
})

describe('buildArchiveRows', () => {
  it('lists one row per product per zone it covers, with the valid date and folded danger', () => {
    const rows = buildArchiveRows(
      [
        // Evening publish in Los Angeles → valid the next day; a center-wide summary.
        item({
          id: 10,
          product_type: 'summary',
          published_time: '2026-01-10T02:30:00+00:00',
          danger_rating: -1,
          forecast_zone: [{ id: 1 }, { id: 2 }],
        }),
      ],
      ZONES,
      TZ,
    )

    expect(rows).toEqual([
      expect.objectContaining({
        productId: 10,
        date: '2026-01-10',
        zoneSlug: 'olympics',
        zoneName: 'Olympics',
        productType: 'summary',
        dangerLevel: 0,
        author: 'Forecaster',
      }),
      expect.objectContaining({ productId: 10, zoneSlug: 'west-slopes-north' }),
    ])
  })

  it('skips other product types, bulk-imported history, unknown zones and unparseable times', () => {
    const rows = buildArchiveRows(
      [
        item({ id: 1, product_type: 'weather' }),
        item({ id: 2, product_type: 'synopsis' }),
        item({ id: 3, updated_at: null }),
        item({ id: 4, forecast_zone: [{ id: 99 }] }),
        item({ id: 5, published_time: 'not-a-date' }),
        item({ id: 6 }),
      ],
      ZONES,
      TZ,
    )

    expect(rows.map((row) => row.productId)).toEqual([6])
  })

  it('collapses a zone-day to its latest publication, as the dated route resolves it', () => {
    const rows = buildArchiveRows(
      [
        item({ id: 1, published_time: '2026-01-10T02:30:00+00:00', danger_rating: 2 }),
        // A re-issue the next morning, still valid for the 10th.
        item({ id: 2, published_time: '2026-01-10T15:00:00+00:00', danger_rating: 3 }),
      ],
      ZONES,
      TZ,
    )

    expect(rows).toEqual([expect.objectContaining({ productId: 2, dangerLevel: 3 })])
  })

  it('orders newest first, and within a day in the center zone order', () => {
    const rows = buildArchiveRows(
      [
        item({ id: 1, published_time: '2026-01-09T02:30:00+00:00', forecast_zone: [{ id: 2 }] }),
        item({ id: 2, published_time: '2026-01-10T02:30:00+00:00', forecast_zone: [{ id: 2 }] }),
        item({ id: 3, published_time: '2026-01-10T02:31:00+00:00', forecast_zone: [{ id: 1 }] }),
      ],
      ZONES,
      TZ,
    )

    expect(rows.map((row) => [row.date, row.zoneSlug])).toEqual([
      ['2026-01-10', 'olympics'],
      ['2026-01-10', 'west-slopes-north'],
      ['2026-01-09', 'west-slopes-north'],
    ])
  })

  it('folds every rating outside 1–5 into No Rating', () => {
    expect(archiveDangerLevel(-1)).toBe(0)
    expect(archiveDangerLevel(0)).toBe(0)
    expect(archiveDangerLevel(4)).toBe(4)
    expect(archiveDangerLevel(9)).toBe(0)
  })
})

function row(partial: Partial<ArchiveRow>): ArchiveRow {
  return {
    productId: 1,
    date: '2026-01-10',
    zoneId: 1,
    zoneSlug: 'olympics',
    zoneName: 'Olympics',
    productType: 'forecast',
    dangerLevel: 2,
    author: 'Forecaster',
    publishedTime: '2026-01-10T02:30:00+00:00',
    ...partial,
  }
}

describe('applyArchiveFilters', () => {
  const rows = [
    row({ productId: 1, date: '2026-01-10', zoneSlug: 'olympics', dangerLevel: 2 }),
    row({ productId: 2, date: '2026-01-09', zoneSlug: 'west-slopes-north', dangerLevel: 3 }),
    row({
      productId: 3,
      date: '2025-12-01',
      zoneSlug: 'olympics',
      dangerLevel: 0,
      productType: 'summary',
    }),
  ]

  it('keeps everything inside the date range when nothing else is selected', () => {
    const filters = resolveArchiveFilters(query(), OPTIONS)
    expect(applyArchiveFilters(rows, filters).map((r) => r.productId)).toEqual([1, 2, 3])
  })

  it('narrows by date range', () => {
    const filters = resolveArchiveFilters(query({ from: '2026-01-01' }), OPTIONS)
    expect(applyArchiveFilters(rows, filters).map((r) => r.productId)).toEqual([1, 2])
  })

  it('narrows by zone, danger and product type together', () => {
    const filters = resolveArchiveFilters(
      query({ zone: ['olympics'], danger: [0, 2], type: ['summary'] }),
      OPTIONS,
    )
    expect(applyArchiveFilters(rows, filters).map((r) => r.productId)).toEqual([3])
  })
})

describe('dangerCounts', () => {
  it('tallies rows by level 0–5', () => {
    expect(
      dangerCounts([row({ dangerLevel: 2 }), row({ dangerLevel: 2 }), row({ dangerLevel: 5 })]),
    ).toEqual([0, 0, 2, 0, 0, 1])
  })
})

describe('paginateArchiveRows', () => {
  const rows = Array.from({ length: 120 }, (_, i) => row({ productId: i + 1 }))

  it('pages fifty at a time', () => {
    const first = paginateArchiveRows(rows, 1)
    expect(first).toMatchObject({ page: 1, pageCount: 3, total: 120 })
    expect(first.rows.map((r) => r.productId)).toEqual(rows.slice(0, 50).map((r) => r.productId))

    const last = paginateArchiveRows(rows, 3)
    expect(last.rows).toHaveLength(20)
  })

  it('clamps a page past the end to the last page, and an empty list to page one', () => {
    expect(paginateArchiveRows(rows, 9)).toMatchObject({ page: 3, pageCount: 3 })
    expect(paginateArchiveRows([], 3)).toMatchObject({ page: 1, pageCount: 1, total: 0, rows: [] })
  })
})

describe('archiveRowHref', () => {
  it('links to the dated forecast view for the row zone and valid date', () => {
    expect(
      archiveRowHref({ zoneSlug: 'soldier-&-wood-river-valley-mtns', date: '2026-04-05' }),
    ).toBe('/forecasts/avalanche/soldier-&-wood-river-valley-mtns/2026-04-05')
  })
})
