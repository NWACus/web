import type { ArchiveProductSummary } from '@/services/nac/archiveDates'
import { paginateArchiveRows } from '@/services/nac/forecastArchive'
import {
  applyWeatherArchiveFilters,
  buildWeatherArchiveRows,
  weatherArchiveRowHref,
} from '@/services/nac/weatherArchive'

const TZ = 'America/Denver'

function item(
  partial: Partial<ArchiveProductSummary> & Pick<ArchiveProductSummary, 'id'>,
): ArchiveProductSummary {
  return {
    product_type: 'weather',
    published_time: '2026-01-09T12:41:00+00:00',
    danger_rating: -1,
    author: 'Forecaster',
    updated_at: '2026-01-09T12:41:08+00:00',
    forecast_zone: [{ id: 1 }, { id: 2 }],
    ...partial,
  }
}

describe('buildWeatherArchiveRows', () => {
  it('lists weather products only, one row each however many zones they cover', () => {
    const rows = buildWeatherArchiveRows(
      [
        item({ id: 1 }),
        item({ id: 2, product_type: 'forecast', danger_rating: 2 }),
        item({ id: 3, product_type: 'summary' }),
        item({ id: 4, product_type: 'synopsis' }),
      ],
      TZ,
    )

    expect(rows).toEqual([
      {
        productId: 1,
        date: '2026-01-09',
        author: 'Forecaster',
        publishedTime: '2026-01-09T12:41:00+00:00',
      },
    ])
  })

  it('dates a product by the day it was issued in the center timezone, with no noon cutover', () => {
    const rows = buildWeatherArchiveRows(
      [
        // 5:41 PM MST on Jan 9: a forecast would be Jan 10's, but weather is dated when issued.
        item({ id: 1, published_time: '2026-01-10T00:41:00+00:00' }),
        // 11 PM MST on Jan 9 is already Jan 10 in UTC.
        item({ id: 2, published_time: '2026-01-10T06:00:00+00:00' }),
      ],
      TZ,
    )

    expect(rows.map((row) => row.date)).toEqual(['2026-01-09', '2026-01-09'])
  })

  it('keeps both of a day with a re-issue, since each row links to its own product', () => {
    const rows = buildWeatherArchiveRows(
      [
        item({ id: 1, published_time: '2026-01-09T13:00:00+00:00' }),
        item({ id: 2, published_time: '2026-01-09T20:00:00+00:00' }),
      ],
      TZ,
    )

    expect(rows.map((row) => row.productId)).toEqual([2, 1])
  })

  it('sorts newest first whatever order upstream answers in', () => {
    const rows = buildWeatherArchiveRows(
      [
        item({ id: 1, published_time: '2026-01-07T12:00:00+00:00' }),
        item({ id: 3, published_time: '2026-01-09T12:00:00+00:00' }),
        item({ id: 2, published_time: '2026-01-08T12:00:00+00:00' }),
      ],
      TZ,
    )

    expect(rows.map((row) => row.productId)).toEqual([3, 2, 1])
  })

  it('hides bulk-imported history (null updated_at) and unparseable timestamps', () => {
    const rows = buildWeatherArchiveRows(
      [item({ id: 1, updated_at: null }), item({ id: 2, published_time: 'not a date' })],
      TZ,
    )

    expect(rows).toEqual([])
  })

  it('keeps a product with no author', () => {
    const [row] = buildWeatherArchiveRows([item({ id: 1, author: null })], TZ)

    expect(row.author).toBeNull()
  })
})

describe('applyWeatherArchiveFilters', () => {
  const rows = buildWeatherArchiveRows(
    [
      item({ id: 1, published_time: '2026-01-07T12:00:00+00:00' }),
      item({ id: 2, published_time: '2026-01-08T12:00:00+00:00' }),
      item({ id: 3, published_time: '2026-01-09T12:00:00+00:00' }),
    ],
    TZ,
  )

  it('keeps the rows within the range, inclusive at both ends', () => {
    const shown = applyWeatherArchiveFilters(rows, { from: '2026-01-08', to: '2026-01-09' })

    expect(shown.map((row) => row.productId)).toEqual([3, 2])
  })

  it('leaves nothing when the range holds no products', () => {
    expect(applyWeatherArchiveFilters(rows, { from: '2026-02-01', to: '2026-02-28' })).toEqual([])
  })
})

describe('weather archive pagination and links', () => {
  it('pages weather rows fifty at a time, as the forecast list does', () => {
    const rows = buildWeatherArchiveRows(
      Array.from({ length: 51 }, (_, i) =>
        item({ id: i + 1, published_time: `2026-01-01T12:${String(i).padStart(2, '0')}:00+00:00` }),
      ),
      TZ,
    )

    const second = paginateArchiveRows(rows, 2)
    expect(second.pageCount).toBe(2)
    expect(second.rows.map((row) => row.productId)).toEqual([1])
  })

  it('links a row to the archived product by id', () => {
    expect(weatherArchiveRowHref({ productId: 177512 })).toBe(
      '/forecasts/avalanche/archive/mountain-weather/177512',
    )
  })
})
