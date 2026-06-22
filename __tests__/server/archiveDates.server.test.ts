import {
  buildZoneArchiveDates,
  findProductIdForDate,
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

  it('collapses same-date products to the most recently published', () => {
    const items: ArchiveProductSummary[] = [
      item({ id: 10, published_time: '2026-02-01T02:00:00+00:00', danger_rating: 1 }), // 2026-01-31 18:00 PST → 2026-02-01
      item({ id: 11, published_time: '2026-02-01T05:00:00+00:00', danger_rating: 3 }), // 2026-01-31 21:00 PST → 2026-02-01 (later)
    ]

    const dates = buildZoneArchiveDates(items, 1646, TZ)

    expect(dates).toHaveLength(1)
    // The later publication wins, and its danger rating is carried for coloring.
    expect(dates[0]).toEqual({
      date: '2026-02-01',
      productId: 11,
      productType: 'forecast',
      dangerRating: 3,
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

describe('findProductIdForDate', () => {
  const dates = [
    { date: '2026-01-08', productId: 21, productType: 'forecast', dangerRating: 2 },
    { date: '2026-01-06', productId: 22, productType: 'forecast', dangerRating: 3 },
  ]

  it('resolves a known date to its product id', () => {
    expect(findProductIdForDate(dates, '2026-01-06')).toBe(22)
  })

  it('returns null for a date with no product', () => {
    expect(findProductIdForDate(dates, '2026-01-07')).toBeNull()
  })
})
