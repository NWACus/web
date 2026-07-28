import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { buildChartOption } from '@/components/WeatherStations/stationGraphOptions'
import { NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const TEMP_PRESET = { key: 'temp', title: 'Temperature', variables: ['air_temp'] }
const RH_PRESET = { key: 'rh', title: 'Relative Humidity', variables: ['relative_humidity'] }

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

describe('buildChartOption wind band', () => {
  const WIND_PRESET = {
    key: 'wind',
    title: 'Wind Speed',
    variables: ['wind_speed_min', 'wind_speed', 'wind_gust'],
    band: { lower: 'wind_speed_min', upper: 'wind_gust' },
  }
  const T = 1_700_000_000_000

  function wind(variable: string, value: number | null): GraphData['series'][number] {
    return {
      kind: 'raw',
      stid: '1',
      stationName: 'Station 1',
      variable,
      label: `Station 1 ${variable}`,
      unit: 'mph',
      points: [[T, value]],
    }
  }

  type BandSeries = LineSeries & { name?: string; areaStyle?: { opacity?: number }; data?: unknown }

  function isBandSeriesArray(value: unknown): value is BandSeries[] {
    return Array.isArray(value) && value.every((s) => typeof s === 'object' && s !== null)
  }

  function chartSeries(option: Record<string, unknown>): BandSeries[] {
    if (!isBandSeriesArray(option.series)) throw new Error('expected a series array')
    return option.series
  }

  it('collapses min and gust into a shaded band around the speed line', () => {
    const data: GraphData = {
      series: [wind('wind_speed_min', 5), wind('wind_speed', 10), wind('wind_gust', 20)],
      aggregated: false,
      timezone: 'x',
    }
    const option = buildChartOption(data, WIND_PRESET)
    const series = chartSeries(option)

    expect(series.map((s) => s.name)).toEqual([
      'Station 1 wind_speed',
      'Station 1 wind_speed_min band',
      'Station 1 wind_gust band',
    ])
    const area = series.find((s) => s.areaStyle)
    expect(area?.data).toEqual([[T, 15]])
  })

  it('keeps plain lines when a band edge is missing', () => {
    const data: GraphData = {
      series: [wind('wind_speed_min', 5), wind('wind_speed', 10)],
      aggregated: false,
      timezone: 'x',
    }
    const series = chartSeries(buildChartOption(data, WIND_PRESET))

    expect(series.map((s) => s.name)).toEqual(['Station 1 wind_speed_min', 'Station 1 wind_speed'])
    expect(series.some((s) => s.areaStyle)).toBe(false)
  })

  it('breaks the band where either edge is null', () => {
    const data: GraphData = {
      series: [wind('wind_speed_min', null), wind('wind_speed', 10), wind('wind_gust', 20)],
      aggregated: false,
      timezone: 'x',
    }
    const area = chartSeries(buildChartOption(data, WIND_PRESET)).find((s) => s.areaStyle)
    expect(area?.data).toEqual([[T, null]])
  })
})

describe('StationGraphs compare picker', () => {
  const [current, other, third, fourth, fifth] = NWAC_WEATHER_STATION_GROUPS
  if (!fifth) throw new Error('registry needs at least five groups')

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

  function renderWithCompares(...slugs: string[]): HTMLElement {
    renderGraphs()
    const select = screen.getByLabelText(/Compare with/)
    for (const slug of slugs) {
      fireEvent.change(select, { target: { value: slug } })
    }
    return select
  }

  it('refetches with the stids of each added station appended', () => {
    renderWithCompares(other.slug, third.slug)

    const expected = [...current.stids, ...other.stids, ...third.stids].join(',')
    expect(fetchedUrls().some((url) => url.includes(`stids=${encodeURIComponent(expected)}`))).toBe(
      true,
    )
  })

  it('removes a station via its chip', () => {
    renderWithCompares(other.slug, third.slug)
    fireEvent.click(screen.getByLabelText(`Remove ${other.displayName}`))

    const urls = fetchedUrls()
    const expected = [...current.stids, ...third.stids].join(',')
    expect(urls[urls.length - 1]).toContain(`stids=${encodeURIComponent(expected)}`)
  })

  it('hides selected stations from the options and disables the select at the cap', () => {
    const select = renderWithCompares(other.slug)

    const values = Array.from(select.querySelectorAll('option')).map((o) => o.value)
    expect(values).not.toContain(other.slug)
    expect(select).not.toBeDisabled()

    fireEvent.change(select, { target: { value: third.slug } })
    fireEvent.change(select, { target: { value: fourth.slug } })
    expect(select).toBeDisabled()
  })
})

describe('StationGraphs chart arrangement', () => {
  const current = NWAC_WEATHER_STATION_GROUPS[0]
  const fetchMock = jest.fn()
  const dataWithSeries: GraphData = { series: [series('1')], aggregated: false, timezone: 'x' }

  beforeEach(() => {
    window.localStorage.clear()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true, json: async () => dataWithSeries })
    global.fetch = fetchMock
  })

  function renderGraphs() {
    render(
      <StationGraphs
        stids={current.stids}
        presets={[TEMP_PRESET, RH_PRESET]}
        currentSlug={current.slug}
      />,
    )
  }

  async function expectChartOrder(titles: string[]): Promise<void> {
    const buttons = await screen.findAllByLabelText(/^Move .* down$/)
    const labels = buttons.map((b) => b.getAttribute('aria-label') ?? '')
    expect(labels).toEqual(titles.map((title) => `Move ${title} down`))
  }

  it('moves a chart down past its neighbor', async () => {
    renderGraphs()
    await expectChartOrder(['Temperature', 'Relative Humidity'])

    fireEvent.click(screen.getByLabelText('Move Temperature down'))
    await expectChartOrder(['Relative Humidity', 'Temperature'])
  })

  it('hides a chart into a restorable chip', async () => {
    renderGraphs()
    fireEvent.click(await screen.findByLabelText('Hide Temperature'))
    expect(screen.queryByLabelText('Hide Temperature')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Show Temperature'))
    expect(await screen.findByLabelText('Hide Temperature')).toBeInTheDocument()
  })

  it('persists the arrangement to localStorage', async () => {
    renderGraphs()
    fireEvent.click(await screen.findByLabelText('Hide Temperature'))

    const stored = window.localStorage.getItem('nwac-station-graph-prefs') ?? ''
    expect(stored).toContain('"hidden":["temp"]')
  })
})
