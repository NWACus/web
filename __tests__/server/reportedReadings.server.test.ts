const fetchStationTimeseriesMock = jest.fn()
jest.mock('../../src/services/snowobs/snowobs', () => ({
  fetchStationTimeseries: (...args: unknown[]) => fetchStationTimeseriesMock(...args),
}))

import { reportedReadings } from '@/collections/StationPages/endpoints/reportedReadings'
import { readingsByStation } from '@/services/snowobs/deriveColumns'
import type { SnowObsTimeseriesResponse } from '@/services/snowobs/types/schemas'
import type { PayloadRequest } from 'payload'

function station(stid: string, source: string, variables: string[]) {
  const observations: Record<string, (number | null)[]> = {}
  for (const v of ['date_time', ...variables]) observations[v] = [1]
  return { id: stid, stid, source, name: stid, observations }
}

const response: SnowObsTimeseriesResponse = {
  UNITS: {},
  VARIABLES: [],
  STATION: [
    station('22', 'nwac', ['air_temp', 'battery_voltage', 'wind_speed']),
    station('515', 'snotel', ['wind_gust', 'snow_depth']),
  ],
}

function request(query: string, user: unknown = { id: 1 }): PayloadRequest {
  const logger = { error: jest.fn() }
  return Object.assign(Object.create(null), {
    url: `http://localhost/api/stationPages/reported-readings?${query}`,
    user,
    payload: { logger },
  })
}

describe('readingsByStation', () => {
  it("lists each station's table readings, battery and timestamps left out", () => {
    const refs = [
      { stid: '22', source: 'nwac' },
      { stid: '515', source: 'snotel' },
      { stid: '9', source: 'nwac' },
    ]
    expect(readingsByStation(response, refs)).toEqual({
      'nwac:22': ['air_temp', 'wind_speed'],
      'snotel:515': ['wind_gust', 'snow_depth'],
      'nwac:9': [],
    })
  })
})

describe('the reported-readings endpoint', () => {
  beforeEach(() => {
    fetchStationTimeseriesMock.mockReset()
    fetchStationTimeseriesMock.mockResolvedValue(response)
  })

  it("fetches the table's default 24 hours, as the table does, and groups by station", async () => {
    const res = await reportedReadings(request('center=nwac&stations=nwac:22,snotel:515'))
    expect(res.status).toBe(200)
    expect((await res.json()).readings['snotel:515']).toEqual(['wind_gust', 'snow_depth'])
    expect(fetchStationTimeseriesMock).toHaveBeenCalledWith(
      'nwac',
      [
        { source: 'nwac', stid: '22' },
        { source: 'snotel', stid: '515' },
      ],
      { windowHours: 24, revalidate: 60, rawData: true },
    )
  })

  it('refuses an anonymous caller, an unknown center or malformed stations', async () => {
    expect((await reportedReadings(request('center=nwac&stations=nwac:22', null))).status).toBe(401)
    expect((await reportedReadings(request('center=nope&stations=nwac:22'))).status).toBe(400)
    expect((await reportedReadings(request('center=nwac&stations=22'))).status).toBe(400)
    expect(fetchStationTimeseriesMock).not.toHaveBeenCalled()
  })

  it('reports a SnowObs failure as a 502', async () => {
    fetchStationTimeseriesMock.mockRejectedValue(new Error('SnowObs down'))
    const res = await reportedReadings(request('center=nwac&stations=nwac:22'))
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe('SnowObs down')
  })
})
