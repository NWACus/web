import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { buildChartOption } from '@/components/WeatherStations/stationGraphOptions'
import { NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

// The ECharts canvas never mounts in these tests (fetches resolve to empty data).
jest.mock('next/dynamic', () => () => {
  const Noop = () => null
  return Noop
})

const PRESET = { key: 'temp', title: 'Temperature', variables: ['air_temp'] }

function series(stid: string): GraphData['series'][number] {
  return {
    kind: 'raw',
    stid,
    stationName: `Station ${stid}`,
    variable: 'air_temp',
    label: `Station ${stid} Temp`,
    unit: '°F',
    points: [[1_700_000_000_000, 30]],
  }
}

type LineSeries = { lineStyle?: { type?: string } }

function isLineSeriesArray(value: unknown): value is LineSeries[] {
  return Array.isArray(value) && value.every((s) => typeof s === 'object' && s !== null)
}

// The rendered series' lineStyle.type values, in order.
function seriesLineTypes(option: Record<string, unknown>): (string | undefined)[] {
  if (!isLineSeriesArray(option.series)) throw new Error('expected a series array')
  return option.series.map((s) => s.lineStyle?.type)
}

describe('buildChartOption comparison styling', () => {
  const data: GraphData = { series: [series('1'), series('9')], aggregated: false, timezone: 'x' }

  it('dashes series from stations outside primaryStids', () => {
    const option = buildChartOption(data, PRESET, ['1'])
    expect(seriesLineTypes(option)).toEqual([undefined, 'dashed'])
  })

  it('leaves everything solid when primaryStids is omitted', () => {
    const option = buildChartOption(data, PRESET)
    expect(seriesLineTypes(option)).toEqual([undefined, undefined])
  })
})

describe('StationGraphs compare picker', () => {
  const current = NWAC_WEATHER_STATION_GROUPS[0]
  const other = NWAC_WEATHER_STATION_GROUPS.find((g) => g.slug !== current.slug)
  if (!other) throw new Error('registry needs at least two groups')

  const emptyData: GraphData = { series: [], aggregated: false, timezone: 'x' }

  const fetchMock = jest.fn()

  function fetchedUrls(): string[] {
    return fetchMock.mock.calls.map((call) => String(call[0]))
  }

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true, json: async () => emptyData })
    global.fetch = fetchMock
  })

  function renderGraphs() {
    render(<StationGraphs stids={current.stids} presets={[PRESET]} currentSlug={current.slug} />)
  }

  it('excludes the current station from the compare options', () => {
    renderGraphs()
    const select = screen.getByLabelText(/Compare with/)
    const values = Array.from(select.querySelectorAll('option')).map((o) => o.value)
    expect(values).not.toContain(current.slug)
    expect(values).toContain(other.slug)
  })

  it('refetches with the comparison stids appended', () => {
    renderGraphs()
    fireEvent.change(screen.getByLabelText(/Compare with/), { target: { value: other.slug } })

    const expected = [...current.stids, ...other.stids].join(',')
    expect(fetchedUrls().some((url) => url.includes(`stids=${encodeURIComponent(expected)}`))).toBe(
      true,
    )
  })

  it('drops back to the base stids when compare is cleared', () => {
    renderGraphs()
    const select = screen.getByLabelText(/Compare with/)
    fireEvent.change(select, { target: { value: other.slug } })
    fireEvent.change(select, { target: { value: '' } })

    const urls = fetchedUrls()
    expect(urls[urls.length - 1]).toContain(`stids=${encodeURIComponent(current.stids.join(','))}`)
  })
})
