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
    columns: [],
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
  it('caches its SnowObs request for 60 seconds, as SnowObs does', async () => {
    await resolveTabView(context, 'table')
    expect(fetchStationTimeseriesMock).toHaveBeenCalledWith(
      'nwac',
      context.subject.stations,
      expect.objectContaining({ rawData: true, revalidate: 60, windowHours: 24 }),
    )
  })
})
