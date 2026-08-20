import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { buildChartOption } from '@/components/WeatherStations/stationGraphOptions'
import { NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import type { GraphData } from '@/services/snowobs/graph'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const TEMP_PRESET = { key: 'temp', title: 'Temperature', variables: ['air_temp'] }
const RH_PRESET = { key: 'rh', title: 'Relative Humidity', variables: ['relative_humidity'] }

// The ECharts canvas never mounts in these tests.
jest.mock('next/dynamic', () => () => {
  const Noop = () => null
  return Noop
})

// jsdom lacks the layout APIs Radix Select's positioning touches.
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub
})

function openEditView() {
  fireEvent.click(screen.getByRole('button', { name: /Edit graphs/ }))
}

// Radix Select: a click (initial pointer type "touch") both opens the
// trigger and commits an option.
function openSelect(name: string) {
  fireEvent.click(screen.getByRole('combobox', { name }))
}

function pickOption(name: string) {
  fireEvent.click(screen.getByRole('option', { name }))
}

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
  tooltip?: { valueFormatter?: unknown }
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

  // Walks a key path through nested plain objects without type assertions.
  function nested(value: unknown, keys: string[]): unknown {
    let current = value
    for (const key of keys) {
      if (typeof current !== 'object' || current === null) return undefined
      current = Object.entries(current).find(([k]) => k === key)?.[1]
    }
    return current
  }

  function tooltipFormat(option: Record<string, unknown>, value: number): string {
    const formatter = chartSeries(option)[0].tooltip?.valueFormatter
    if (typeof formatter !== 'function') throw new Error('expected valueFormatter')
    return String(formatter(value))
  }

  // Digs the axis-pointer label formatter out of the chart-level tooltip.
  function dateHeaderFormat(option: Record<string, unknown>, value: number): string {
    const formatter = nested(option, ['tooltip', 'axisPointer', 'label', 'formatter'])
    if (typeof formatter !== 'function') throw new Error('expected axis pointer formatter')
    return String(formatter({ value }))
  }

  it('formats tooltip values to one decimal with the unit appended', () => {
    expect(tooltipFormat(buildChartOption(data, TEMP_PRESET), 31.26)).toBe('31.3 °F')
    expect(tooltipFormat(buildChartOption(data, BAR_PRESET), 0.16)).toBe('0.2 °F')
    expect(tooltipFormat(buildChartOption(data, TEMP_PRESET), Number.NaN)).toBe('–')
  })

  it('formats the tooltip date header human-readably', () => {
    const t = new Date(2026, 0, 10, 14, 30).getTime()
    expect(dateHeaderFormat(buildChartOption(data, TEMP_PRESET), t)).toBe('Sat Jan 10, 14:30')
    const daily: GraphData = { ...data, aggregated: true }
    expect(dateHeaderFormat(buildChartOption(daily, TEMP_PRESET), t)).toBe('Sat Jan 10, 2026')
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

    // Band helpers share the station's legend name so legend-hiding the
    // station hides its band too.
    expect(series.map((s) => s.name)).toEqual(['Station 1', 'Station 1', 'Station 1'])
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
    openSelect('Compare with')
    expect(screen.queryByRole('option', { name: current.displayName })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: other.displayName })).toBeInTheDocument()
  })

  function renderWithCompares(...groups: (typeof current)[]) {
    renderGraphs()
    for (const group of groups) {
      openSelect('Compare with')
      pickOption(group.displayName)
    }
  }

  it('refetches with the stids of each added station appended', () => {
    renderWithCompares(other, third)

    const expected = [...current.stids, ...other.stids, ...third.stids].join(',')
    expect(fetchedUrls().some((url) => url.includes(`stids=${encodeURIComponent(expected)}`))).toBe(
      true,
    )
  })

  it('removes a station via its toolbar chip', () => {
    renderWithCompares(other, third)
    fireEvent.click(screen.getByLabelText(`Remove ${other.displayName}`))

    const urls = fetchedUrls()
    const expected = [...current.stids, ...third.stids].join(',')
    expect(urls[urls.length - 1]).toContain(`stids=${encodeURIComponent(expected)}`)
  })

  it('shows removable chips for compared stations in the toolbar', () => {
    renderWithCompares(other, third)
    expect(screen.getByLabelText(`Remove ${other.displayName}`)).toBeInTheDocument()
    expect(screen.getByLabelText(`Remove ${third.displayName}`)).toBeInTheDocument()
  })

  it('hides selected stations from the options and disables the select at the cap', () => {
    renderWithCompares(other)
    const combobox = () => screen.getByRole('combobox', { name: 'Compare with' })
    expect(combobox()).not.toBeDisabled()

    openSelect('Compare with')
    expect(screen.queryByRole('option', { name: other.displayName })).not.toBeInTheDocument()
    pickOption(third.displayName)

    openSelect('Compare with')
    pickOption(fourth.displayName)
    expect(combobox()).toBeDisabled()
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

  function graphCheckbox(title: string): HTMLElement {
    return screen.getByRole('checkbox', { name: title })
  }

  async function expectRowOrder(titles: string[]): Promise<void> {
    const buttons = await screen.findAllByLabelText(/^Move .* down$/)
    const labels = buttons.map((b) => b.getAttribute('aria-label') ?? '')
    expect(labels).toEqual(titles.map((title) => `Move ${title} down`))
  }

  it('moves a graph down past its neighbor', async () => {
    renderGraphs()
    openEditView()
    await expectRowOrder(['Temperature', 'Relative Humidity'])

    fireEvent.click(screen.getByLabelText('Move Temperature down'))
    await expectRowOrder(['Relative Humidity', 'Temperature'])
  })

  it('hides a graph, counts it on the trigger, and restores it from the dialog', async () => {
    renderGraphs()
    openEditView()
    fireEvent.click(graphCheckbox('Temperature'))
    expect(graphCheckbox('Temperature')).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.getByRole('button', { name: 'Edit graphs 1 hidden' })).toBeInTheDocument()

    openEditView()
    fireEvent.click(graphCheckbox('Temperature'))
    expect(graphCheckbox('Temperature')).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('button', { name: 'Edit graphs' })).toBeInTheDocument()
  })

  it('keeps the arrangement to the session rather than persisting it', () => {
    renderGraphs()
    openEditView()
    fireEvent.click(graphCheckbox('Temperature'))

    // The configured default is what every reader starts from, so a change to
    // the defaults reaches everyone instead of being masked by stored prefs.
    expect(window.localStorage.getItem('nwac-station-graph-prefs')).toBeNull()
  })

  it('starts a defaultHidden graph off, still listed in the dialog', () => {
    render(
      <StationGraphs
        stids={current.stids}
        presets={[TEMP_PRESET, { ...RH_PRESET, defaultHidden: true }]}
        currentSlug={current.slug}
      />,
    )
    expect(screen.getByRole('button', { name: 'Edit graphs 1 hidden' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Edit graphs/ }))
    expect(graphCheckbox('Relative Humidity')).not.toBeChecked()
    expect(graphCheckbox('Temperature')).toBeChecked()
  })

  it('hides a graph from its own X button', async () => {
    renderGraphs()
    fireEvent.click(await screen.findByLabelText('Hide Temperature graph'))

    expect(screen.getByRole('button', { name: 'Edit graphs 1 hidden' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Hide Temperature graph')).not.toBeInTheDocument()
  })

  it('resets order and visibility to defaults', async () => {
    renderGraphs()
    openEditView()
    fireEvent.click(screen.getByLabelText('Move Temperature down'))
    fireEvent.click(graphCheckbox('Relative Humidity'))
    await expectRowOrder(['Relative Humidity', 'Temperature'])

    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    await expectRowOrder(['Temperature', 'Relative Humidity'])
    expect(graphCheckbox('Relative Humidity')).toBeChecked()
  })

  it('disables graphs whose variables no station reports', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ...dataWithSeries, series: [series('1', 'air_temp')] }),
    })
    renderGraphs()
    openEditView()
    const rh = () => screen.getByRole('checkbox', { name: /Relative Humidity/ })
    await waitFor(() => expect(rh()).toBeDisabled())
    expect(rh()).not.toBeChecked()
    expect(screen.getByText('No data')).toBeInTheDocument()
  })
})
