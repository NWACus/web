const fetchStationTimeseriesMock = jest.fn()
jest.mock('../../src/services/snowobs/snowobs', () => ({
  fetchStationTimeseries: (...args: unknown[]) => fetchStationTimeseriesMock(...args),
}))

import type { StationTabContext } from '@/components/WeatherStations/stationTabViews'
import { resolveTabView } from '@/components/WeatherStations/stationTabViews'

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
