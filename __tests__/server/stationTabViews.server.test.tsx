const fetchStationTimeseriesMock = jest.fn()
jest.mock('../../src/services/snowobs/snowobs', () => ({
  fetchStationTimeseries: (...args: unknown[]) => fetchStationTimeseriesMock(...args),
}))
jest.mock('../../src/services/snowobs/stationTracking', () => ({
  fetchVariableRounding: jest.fn(async () => ({})),
}))
const withStaleStationsMock = jest.fn()
jest.mock('../../src/services/stations/reportedReadings', () => ({
  withStaleStations: (...args: unknown[]) => withStaleStationsMock(...args),
}))

import type { StationTabContext } from '@/components/WeatherStations/stationTabViews'
import { resolveTabView } from '@/components/WeatherStations/stationTabViews'
import { isValidElement } from 'react'

const context: StationTabContext = {
  center: 'nwac',
  subject: {
    slug: 'alpental',
    archived: false,
    stations: [{ stid: '1', source: 'nwac' }],
    columnOrder: [],
    tabs: ['table', 'graphs', 'csv'],
  },
  pages: [],
  timeZone: 'America/Los_Angeles',
  csv: { action: '/weather/stations/alpental/csv', filePrefix: 'alpental' },
}

beforeEach(() => {
  fetchStationTimeseriesMock.mockReset()
  fetchStationTimeseriesMock.mockResolvedValue({ UNITS: {}, VARIABLES: [], STATION: [] })
  withStaleStationsMock.mockReset()
  withStaleStationsMock.mockImplementation(async (_center, response) => ({ response, stale: [] }))
})

describe('the Table tab', () => {
  it('reads both unit systems, each cached for 60 seconds as SnowObs does', async () => {
    await resolveTabView(context, 'table', {})
    for (const units of ['default', 'metric']) {
      expect(fetchStationTimeseriesMock).toHaveBeenCalledWith(
        'nwac',
        context.subject.stations,
        expect.objectContaining({ units, revalidate: 60, windowHours: 24 }),
      )
    }
  })

  it('still renders the table when the metric read fails', async () => {
    fetchStationTimeseriesMock.mockImplementation(
      async (_c: string, _s: unknown, o: { units?: string }) => {
        if (o.units === 'metric') throw new Error('metric down')
        return { UNITS: {}, VARIABLES: [], STATION: [] }
      },
    )
    const view = await resolveTabView(context, 'table', {})
    const content = view.tabContent
    if (!isValidElement<{ tables: { default: unknown; metric: unknown } }>(content)) {
      throw new Error('expected the table view')
    }
    expect(content.props.tables.default).toBeTruthy()
    expect(content.props.tables.metric).toBeNull()
  })

  it('leaves out the note for a stale station with every reading hidden', async () => {
    const [station] = context.subject.stations
    const stale = {
      key: `${station.source}:${station.stid}`,
      name: 'Hidden',
      lastReported: '2026-10-27T19:00:00Z',
    }
    withStaleStationsMock.mockImplementation(async (_center, response) => ({
      response,
      stale: [stale],
    }))
    const view = await resolveTabView(context, 'table', {})
    const content = view.tabContent
    if (!isValidElement<{ stale: unknown[] }>(content)) throw new Error('expected the table view')
    expect(content.props.stale).toEqual([])
  })

  it('keeps the note for a stale station with a column showing', async () => {
    const stale = { key: 'nwac:1', name: 'Shown', lastReported: '2026-10-27T19:00:00Z' }
    const station = { id: '1', stid: '1', source: 'nwac', observations: { air_temp: [] } }
    withStaleStationsMock.mockImplementation(async (_center, response) => ({
      response: { ...response, STATION: [station] },
      stale: [stale],
    }))
    const view = await resolveTabView(context, 'table', {})
    const content = view.tabContent
    if (!isValidElement<{ stale: unknown[] }>(content)) throw new Error('expected the table view')
    expect(content.props.stale).toEqual([stale])
  })

  it('reads a valid custom range as whole days in the center zone', async () => {
    await resolveTabView(context, 'table', { from: '2026-01-03', to: '2026-01-09' })
    expect(fetchStationTimeseriesMock).toHaveBeenCalledWith(
      'nwac',
      context.subject.stations,
      expect.objectContaining({
        start: new Date('2026-01-03T08:00:00Z'),
        end: new Date('2026-01-10T07:59:00Z'),
        revalidate: 86400,
      }),
    )
  })

  it('falls back to the default period when the custom range is invalid', async () => {
    await resolveTabView(context, 'table', { from: '2026-01-01', to: '2026-06-01' })
    expect(fetchStationTimeseriesMock).toHaveBeenCalledWith(
      'nwac',
      context.subject.stations,
      expect.objectContaining({ windowHours: 24 }),
    )
  })
})
