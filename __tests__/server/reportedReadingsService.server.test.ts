const fetchStationTimeseriesMock = jest.fn()
const fetchCurrentObservationsMock = jest.fn()
jest.mock('../../src/services/snowobs/snowobs', () => ({
  fetchStationTimeseries: (...args: unknown[]) => fetchStationTimeseriesMock(...args),
}))
jest.mock('../../src/services/snowobs/stationTracking', () => ({
  fetchCurrentObservations: (...args: unknown[]) => fetchCurrentObservationsMock(...args),
}))
jest.mock('../../src/services/snowobs/access', () => ({
  resolveSnowObsToken: async () => 'token',
}))

import { fetchReportedReadings } from '@/services/stations/reportedReadings'

function response(stations: { stid: string; source: string; variables: string[] }[]) {
  return {
    UNITS: {},
    VARIABLES: [],
    STATION: stations.map(({ stid, source, variables }) => ({
      id: stid,
      stid,
      source,
      name: stid,
      observations: Object.fromEntries(['date_time', ...variables].map((v) => [v, [1]])),
    })),
  }
}

const live = { stid: '22', source: 'nwac' }
const stale = { stid: '48', source: 'nwac' }
const silent = { stid: '2172P', source: 'mesowest' }

const NOW = new Date('2026-10-19T12:00:00Z')

beforeEach(() => {
  jest.useFakeTimers({ now: NOW })
  fetchStationTimeseriesMock.mockReset()
  fetchCurrentObservationsMock.mockReset()
})

afterEach(() => jest.useRealTimers())

describe('fetchReportedReadings', () => {
  it("fetches the table's default 24 hours, as the table does, when every station reported", async () => {
    fetchStationTimeseriesMock.mockResolvedValue(response([{ ...live, variables: ['air_temp'] }]))
    expect(await fetchReportedReadings('nwac', [live])).toEqual({
      readings: { 'nwac:22': ['air_temp'] },
      lastReported: {},
    })
    expect(fetchStationTimeseriesMock).toHaveBeenCalledWith('nwac', [live], {
      windowHours: 24,
      revalidate: 60,
    })
    expect(fetchCurrentObservationsMock).not.toHaveBeenCalled()
  })

  it('falls back to the last day of a station that reported in the last 48 hours, and dates it', async () => {
    fetchStationTimeseriesMock
      .mockResolvedValueOnce(response([{ ...live, variables: ['air_temp'] }]))
      .mockResolvedValueOnce(response([{ ...stale, variables: ['snow_depth', 'air_temp'] }]))
    fetchCurrentObservationsMock.mockResolvedValue(
      new Map([
        ['nwac:48', { variables: [], observedAt: '2026-10-18T16:10:00Z' }],
        ['mesowest:2172P', { variables: [], observedAt: null }],
      ]),
    )
    expect(await fetchReportedReadings('nwac', [live, stale, silent])).toEqual({
      readings: {
        'nwac:22': ['air_temp'],
        'nwac:48': ['air_temp', 'snow_depth'],
        'mesowest:2172P': [],
      },
      lastReported: { 'nwac:48': '2026-10-18T16:10:00Z' },
    })
    expect(fetchStationTimeseriesMock).toHaveBeenLastCalledWith('nwac', [stale], {
      start: new Date('2026-10-17T16:10:00Z'),
      end: new Date('2026-10-18T16:10:00Z'),
      revalidate: 3600,
    })
  })

  it("leaves a silent station empty when its last day can't be read", async () => {
    fetchStationTimeseriesMock
      .mockResolvedValueOnce(response([]))
      .mockRejectedValueOnce(new Error('SnowObs 500'))
    fetchCurrentObservationsMock.mockResolvedValue(
      new Map([['nwac:48', { variables: [], observedAt: '2026-10-18T16:10:00Z' }]]),
    )
    expect(await fetchReportedReadings('nwac', [stale])).toEqual({
      readings: { 'nwac:48': [] },
      lastReported: {},
    })
  })

  it('lists nothing for a station quiet longer than 48 hours', async () => {
    fetchStationTimeseriesMock.mockResolvedValueOnce(response([]))
    fetchCurrentObservationsMock.mockResolvedValue(
      new Map([['nwac:48', { variables: [], observedAt: '2026-10-07T23:00:00Z' }]]),
    )
    expect(await fetchReportedReadings('nwac', [stale])).toEqual({
      readings: { 'nwac:48': [] },
      lastReported: {},
    })
    expect(fetchStationTimeseriesMock).toHaveBeenCalledTimes(1)
  })
})
