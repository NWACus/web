import { bucketTitle, splitPartial } from '@/views/Analytics/panels/TrendChart'

const point = (date: string, visitors: number, partial = false) => ({
  date,
  from: date,
  to: date,
  partial,
  visitors,
  visits: visitors,
  pageviews: visitors,
})

describe('splitPartial', () => {
  it('draws complete buckets solid and joins each partial end with a dashed segment', () => {
    const points = [
      point('2026-11-01', 1, true),
      point('2026-11-02', 2),
      point('2026-11-03', 3),
      point('2026-11-04', 4, true),
    ]
    expect(splitPartial(points, 'visitors')).toEqual({
      solid: [null, 2, 3, null],
      dashed: [1, 2, 3, 4],
    })
    expect(splitPartial(points.slice(1, 3), 'visitors').dashed).toEqual([null, null])
  })
})

describe('bucketTitle', () => {
  it('names the days a bucket covers and flags partial ones', () => {
    expect(bucketTitle({ ...point('2026-10-26', 0), to: '2026-11-01' })).toBe(
      'Oct 26 – Nov 1, 2026',
    )
    expect(bucketTitle({ ...point('2026-11-09', 0, true), to: '2026-11-11' })).toBe(
      'Nov 9 – Nov 11, 2026 (partial)',
    )
  })
})
