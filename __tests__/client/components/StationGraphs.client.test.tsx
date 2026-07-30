import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { buildChartOption } from '@/components/WeatherStations/stationGraphOptions'
import { NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const TEMP_PRESET = { key: 'temp', title: 'Temperature', variables: ['air_temp'] }
const RH_PRESET = { key: 'rh', title: 'Relative Humidity', variables: ['relative_humidity'] }

// The ECharts canvas never mounts in these tests.
jest.mock('next/dynamic', () => () => {
  const Noop = () => null
  return Noop
})

function series(stid: string, variable = 'air_temp'): GraphData['series'][number] {
  return {
    kind: 'raw',
    stid,
    stationName: `Station ${stid}`,
    variable,
    label: `Station ${stid}`,
    unit: '°F',
    points: [[1_700_000_000_000, 30]],
  }
}

type ChartSeries = {
  name?: string
  type?: string
  lineStyle?: { type?: string }
  areaStyle?: { opacity?: number }
  data?: unknown
}

function isSeriesArray(value: unknown): value is ChartSeries[] {
  return Array.isArray(value) && value.every((s) => typeof s === 'object' && s !== null)
}

function chartSeries(option: Record<string, unknown>): ChartSeries[] {
  if (!isSeriesArray(option.series)) throw new Error('expected a series array')
  return option.series
}

// The rendered series' lineStyle.type values, in order.
function seriesLineTypes(option: Record<string, unknown>): (string | undefined)[] {
  return chartSeries(option).map((s) => s.lineStyle?.type)
}

describe('buildChartOption comparison styling', () => {
  const data: GraphData = { series: [series('1'), series('9')], aggregated: false, timezone: 'x' }

  it('dashes series from stations outside primaryStids', () => {
    const option = buildChartOption(data, TEMP_PRESET, ['1'])
    expect(seriesLineTypes(option)).toEqual([undefined, 'dashed'])
  })

  it('leaves everything solid when primaryStids is omitted', () => {
    const option = buildChartOption(data, TEMP_PRESET)
    expect(seriesLineTypes(option)).toEqual([undefined, undefined])
  })
})

describe('buildChartOption precision and bar rendering', () => {
  const data: GraphData = { series: [series('1')], aggregated: false, timezone: 'x' }
  const BAR_PRESET = { key: 'precip', title: 'Precipitation', variables: ['air_temp'], bar: true }

  function tooltipFormat(option: Record<string, unknown>, value: number): string {
    const tooltip = option.tooltip
    if (typeof tooltip !== 'object' || tooltip === null) throw new Error('expected tooltip')
    const formatter = Object.entries(tooltip).find(([k]) => k === 'valueFormatter')?.[1]
    if (typeof formatter !== 'function') throw new Error('expected valueFormatter')
    return String(formatter(value))
  }

  it('formats line-chart tooltips to one decimal, bars to two', () => {
    expect(tooltipFormat(buildChartOption(data, TEMP_PRESET), 31.26)).toBe('31.3')
    expect(tooltipFormat(buildChartOption(data, BAR_PRESET), 0.125)).toBe('0.13')
  })

  it('renders bar presets as bar series', () => {
    expect(chartSeries(buildChartOption(data, BAR_PRESET)).map((s) => s.type)).toEqual(['bar'])
    expect(chartSeries(buildChartOption(data, TEMP_PRESET)).map((s) => s.type)).toEqual(['line'])
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
      label: 'Station 1',
      unit: 'mph',
      points: [[T, value]],
    }
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
      'Station 1',
      'Station 1 wind_speed_min',
      'Station 1 wind_gust',
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

    expect(series.map((s) => s.name)).toEqual(['Station 1', 'Station 1'])
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
    render(
      <StationGraphs stids={current.stids} presets={[TEMP_PRESET]} currentSlug={current.slug} />,
    )
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
  // One response serves both charts: a series per preset variable.
  const dataWithSeries: GraphData = {
    series: [series('1', 'air_temp'), series('1', 'relative_humidity')],
    aggregated: false,
    timezone: 'x',
  }

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

  it('drops charts whose variables no station reports', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ...dataWithSeries, series: [series('1', 'air_temp')] }),
    })
    renderGraphs()
    await expectChartOrder(['Temperature'])
    expect(screen.queryByLabelText('Hide Relative Humidity')).not.toBeInTheDocument()
  })
})
