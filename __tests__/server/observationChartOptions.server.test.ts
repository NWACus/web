import {
  INSTABILITY_SERIES,
  SIZE_COLORS,
  SIZE_SERIES,
  TRIGGER_COLORS,
  bucketLabel,
  bucketSpan,
  donutChartOption,
  hasBucketCounts,
  hasCounts,
  problemChartOption,
  roseChartOption,
  roseEdgeLabel,
  roseRadius,
  statsCountLine,
  timeSeriesOption,
  zoneChartOption,
} from '@/components/observations/charts/chartOptions'
import { statsUrl } from '@/components/observations/charts/useAvalancheStats'
import type { AspectElevationRose, StatCount } from '@/services/nac/model/observation'
import { mapAvalancheStats } from '@/services/nac/sources/v2/observationMappers'
import { avalancheStatsSchema } from '@/services/nac/types/observationSchemas'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, '../e2e/mocks/obs', name), 'utf8'))
}

const stats = mapAvalancheStats(avalancheStatsSchema.parse(fixture('avalanche_stats_NWAC.json')))

/** The option's first series' data, whatever ECharts' loose typing says it is. */
function seriesData(option: Record<string, unknown>, index = 0): unknown[] {
  const series = option.series
  if (!Array.isArray(series)) throw new Error('no series')
  const entry: unknown = series[index]
  if (typeof entry !== 'object' || entry === null || !('data' in entry)) throw new Error('no data')
  return Array.isArray(entry.data) ? entry.data : []
}

function axis(
  option: Record<string, unknown>,
  key: 'xAxis' | 'yAxis' | 'angleAxis' | 'radiusAxis',
) {
  const value = option[key]
  if (typeof value !== 'object' || value === null) throw new Error(`no ${key}`)
  return value
}

function callFormatter(target: object, key: string, ...args: unknown[]): unknown {
  const formatter: unknown = Reflect.get(target, key)
  if (typeof formatter !== 'function') throw new Error(`no ${key}`)
  return formatter(...args)
}

describe('zone and problem bars', () => {
  it('draws one blue bar per zone in the API’s order, with the widget’s axis title', () => {
    const option = zoneChartOption(stats.zones)
    expect(axis(option, 'xAxis')).toMatchObject({
      data: stats.zones.map((zone) => zone.name),
      axisLabel: { rotate: 30 },
    })
    expect(axis(option, 'yAxis')).toMatchObject({ name: 'Number of Avalanches', minInterval: 1 })
    expect(seriesData(option)).toEqual(stats.zones.map((zone) => zone.count))
    expect(option.animation).toBe(false)
  })

  it('steepens the labels on a phone and draws the title only for an export', () => {
    expect(axis(zoneChartOption(stats.zones, { narrow: true }), 'xAxis')).toMatchObject({
      axisLabel: { rotate: 60 },
    })
    expect(zoneChartOption(stats.zones).title).toMatchObject({ show: false })
    expect(zoneChartOption(stats.zones, { title: 'Avalanches by Zone' }).title).toMatchObject({
      show: true,
      text: 'Avalanches by Zone',
    })
  })

  it('fixes the problem axis to the nine names, zeros included, and rotates further', () => {
    const option = problemChartOption([{ name: 'Wet Loose', count: 115, showLabel: true }])
    expect(axis(option, 'xAxis')).toMatchObject({
      data: [
        'Dry Loose',
        'Storm Slab',
        'Wind Slab',
        'Persistent Slab',
        'Deep Persistent Slab',
        'Wet Loose',
        'Wet Slab',
        'Glide',
        'Cornice',
      ],
      axisLabel: { rotate: 30 },
    })
    expect(seriesData(option)).toEqual([0, 0, 0, 0, 0, 115, 0, 0, 0])
    expect(axis(problemChartOption([], { narrow: true }), 'xAxis')).toMatchObject({
      axisLabel: { rotate: 70 },
    })
  })

  it('tooltips a bar as "name: count"', () => {
    const tooltip = zoneChartOption(stats.zones).tooltip
    if (typeof tooltip !== 'object' || tooltip === null) throw new Error('no tooltip')
    expect(callFormatter(tooltip, 'formatter', { name: 'Stevens Pass', value: 94 })).toBe(
      'Stevens Pass: 94',
    )
    expect(callFormatter(tooltip, 'formatter', null)).toBe('')
  })
})

describe('donuts', () => {
  it('colours each slice by the widget’s palette and labels only the slices the API marks', () => {
    const option = donutChartOption(stats.triggers, TRIGGER_COLORS)
    expect(seriesData(option)).toEqual([
      {
        name: 'Natural',
        value: 299,
        itemStyle: { color: '#fd7e14' },
        label: { show: true },
      },
      expect.objectContaining({ name: 'Human', itemStyle: { color: '#dc3545' } }),
      expect.objectContaining({ name: 'Explosive', label: { show: false } }),
      expect.objectContaining({ name: 'Unknown', itemStyle: { color: '#006e97' } }),
    ])
  })

  it('leaves out an empty slice, and falls back to blue for a name it doesn’t know', () => {
    const sizes: StatCount[] = [
      { name: 'D1', count: 3, showLabel: true },
      { name: 'D3', count: 0, showLabel: false },
      { name: 'D9', count: 1, showLabel: false },
    ]
    expect(seriesData(donutChartOption(sizes, SIZE_COLORS)).map((item) => item)).toEqual([
      expect.objectContaining({ name: 'D1', itemStyle: { color: '#ffc107' } }),
      expect.objectContaining({ name: 'D9', itemStyle: { color: '#006e97' } }),
    ])
  })
})

describe('time series', () => {
  it('labels days and weeks by their start and months by name', () => {
    expect(bucketLabel('2026-02-08', 'daily')).toBe('2/8')
    expect(bucketLabel('2026-02-08', 'weekly')).toBe('2/8')
    expect(bucketLabel('2026-02-01', 'monthly')).toBe('Feb')
    expect(bucketSpan({ date: '2026-02-08', periodEnd: '2026-02-08' })).toBe('2/8')
    expect(bucketSpan({ date: '2026-02-08', periodEnd: '2026-02-14' })).toBe('2/8 – 2/14')
  })

  it('stacks one bar series per D-size over the buckets, legend below', () => {
    const chart = {
      buckets: stats.avalanchesOverTime,
      aggregation: stats.aggregation,
      series: SIZE_SERIES,
      yName: 'Number of Avalanches',
    }
    const option = timeSeriesOption(chart)
    const series = option.series
    if (!Array.isArray(series)) throw new Error('no series')
    expect(series.map((entry) => entry.name)).toEqual(['D1', 'D2', 'D3', 'D4-5'])
    expect(series.every((entry) => entry.stack === 'total')).toBe(true)
    expect(seriesData(option, 1)[1]).toBe(14)
    expect(axis(option, 'xAxis')).toMatchObject({
      data: expect.arrayContaining(['2/1', '2/8']),
      axisLabel: { rotate: 45 },
    })
    expect(option.legend).toMatchObject({ orient: 'horizontal', data: ['D1', 'D2', 'D3', 'D4-5'] })
    expect(timeSeriesOption(chart, { narrow: true }).legend).toMatchObject({ orient: 'vertical' })
  })

  it('tooltips a bucket’s span and its non-zero series', () => {
    const option = timeSeriesOption({
      buckets: stats.instabilityOverTime,
      aggregation: 'weekly',
      series: INSTABILITY_SERIES,
      yName: 'Number of Observations',
    })
    const tooltip = option.tooltip
    if (typeof tooltip !== 'object' || tooltip === null) throw new Error('no tooltip')
    const params = [
      { seriesName: 'Avalanches Observed', value: 12, dataIndex: 1 },
      { seriesName: 'Cracking/Collapsing Observed', value: 6, dataIndex: 1 },
      { seriesName: 'No Instability Observed', value: 0, dataIndex: 1 },
    ]
    expect(callFormatter(tooltip, 'formatter', params)).toBe(
      '2/8 – 2/14<br/>Avalanches Observed: 12<br/>Cracking/Collapsing Observed: 6',
    )
    expect(callFormatter(tooltip, 'formatter', [{ dataIndex: 0, value: 0 }])).toBe(
      '2/1 – 2/7<br/>None',
    )
  })

  it('knows an all-zero series from an empty one', () => {
    expect(hasBucketCounts(stats.avalanchesOverTime)).toBe(true)
    expect(
      hasBucketCounts([{ date: '2026-10-12', periodEnd: '2026-10-12', counts: { D1: 0 } }]),
    ).toBe(false)
    expect(hasCounts([{ count: 0 }, { count: 0 }])).toBe(false)
  })
})

describe('aspect and elevation rose', () => {
  const rose: AspectElevationRose = stats.rose

  it('places the highest band innermost, one empty ring in from the centre', () => {
    expect(roseRadius(5, 6)).toBe(1.5)
    expect(roseRadius(0, 6)).toBe(6.5)
  })

  it('labels whole-thousand ring edges, the unit on the highest', () => {
    expect(roseEdgeLabel(0, rose.bands)).toBe('12k ft')
    expect(roseEdgeLabel(1, rose.bands)).toBe('')
    expect(roseEdgeLabel(2, rose.bands)).toBe('10')
    expect(roseEdgeLabel(7, rose.bands)).toBe('0')
    expect(roseEdgeLabel(8, rose.bands)).toBe('')
    const odd = [{ label: '', from: 500, to: 1500 }]
    expect(roseEdgeLabel(0, odd)).toBe('')
    expect(roseEdgeLabel(0, [])).toBe('')
  })

  it('draws every non-empty cell at its band’s radius and aspect, circles sized to the count', () => {
    const option = roseChartOption(rose, { mode: 'circles', height: 420 })
    const data = seriesData(option)
    const north = data.find(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'name' in item &&
        'value' in item &&
        Array.isArray(item.value) &&
        item.value[1] === 5 &&
        item.value[0] === 4.5,
    )
    expect(north).toEqual({ name: '4,000 - 6,000ft', value: [4.5, 5, 47] })
    expect(data.length).toBe(rose.cells.filter((cell) => cell.count > 0).length)
    expect(axis(option, 'angleAxis')).toMatchObject({
      data: ['SE', 'S', 'SW', 'W', 'NW', 'N', 'NE', 'E'],
      startAngle: -22.5,
    })
    expect(axis(option, 'radiusAxis')).toMatchObject({ min: 0, max: 7, interval: 1 })
    const series = option.series
    if (!Array.isArray(series)) throw new Error('no series')
    const symbolSize: unknown = series[0].symbolSize
    if (typeof symbolSize !== 'function') throw new Error('no symbolSize')
    const largest = Math.max(...rose.cells.map((cell) => cell.count))
    expect(symbolSize([4.5, 6, largest])).toBeGreaterThan(symbolSize([4.5, 6, 1]))
    expect(symbolSize([4.5, 6, 0])).toBe(0)
  })

  it('shows the counts themselves in numbers mode', () => {
    const option = roseChartOption(rose, { mode: 'numbers', height: 420 })
    const series = option.series
    if (!Array.isArray(series)) throw new Error('no series')
    expect(series[0]).toMatchObject({ symbolSize: 1, label: { show: true } })
    const label: unknown = series[0].label
    if (typeof label !== 'object' || label === null) throw new Error('no label')
    expect(callFormatter(label, 'formatter', { value: [4.5, 5, 47] })).toBe('47')
  })
})

describe('the request and the count line', () => {
  it('asks the stats route for the viewport and zoom, without the list’s sort and page', () => {
    expect(
      statsUrl({
        centerSlug: 'nwac',
        search:
          '?startDate=2026-02-01&endDate=2026-05-01&trigger=%5B%22Human%22%5D&page=2&sortBy=createdAt',
        bbox: [-122.123456, 46.9, -120.3, 48.2],
        zoom: 7,
      }),
    ).toBe(
      '/api/nwac/observations/avalanches/stats?startDate=2026-02-01&endDate=2026-05-01&trigger=%5B%22Human%22%5D&bbox=-122.12346%2C46.90000%2C-120.30000%2C48.20000&zoom=7',
    )
  })

  it('counts avalanches in the map area, as the widget’s count line did', () => {
    expect(statsCountLine(417, { place: null, zoneCount: 0 })).toBe(
      '417 avalanches within map area',
    )
    expect(statsCountLine(1, { place: null, zoneCount: 2 })).toBe(
      '1 avalanche within selected zones',
    )
  })
})
