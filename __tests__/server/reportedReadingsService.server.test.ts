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

import {
  fetchLastReports,
  fetchReportedReadings,
  withStaleStations,
} from '@/services/stations/reportedReadings'

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

  it('falls back to the last day of a quiet station, and dates it', async () => {
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

  it('falls back however long ago the station last reported', async () => {
    fetchStationTimeseriesMock.mockResolvedValueOnce(response([]))
    fetchStationTimeseriesMock.mockResolvedValueOnce(
      response([{ ...stale, variables: ['snow_depth'] }]),
    )
    fetchCurrentObservationsMock.mockResolvedValue(
      new Map([['nwac:48', { variables: [], observedAt: '2026-01-07T23:00:00Z' }]]),
    )
    expect(await fetchReportedReadings('nwac', [stale])).toEqual({
      readings: { 'nwac:48': ['snow_depth'] },
      lastReported: { 'nwac:48': '2026-01-07T23:00:00Z' },
    })
  })
})

describe('withStaleStations', () => {
  it('leaves a logger reporting only its battery alone', async () => {
    const fetched = response([{ ...live, variables: ['battery_voltage'] }])

    const kept = await withStaleStations('nwac', fetched, [live])

    expect(kept).toEqual({ response: fetched, stale: [] })
    expect(fetchCurrentObservationsMock).not.toHaveBeenCalled()
  })

  it('keeps a station with no readings at all as stale', async () => {
    const observedAt = '2026-10-18T12:00:00Z'
    fetchCurrentObservationsMock.mockResolvedValue(new Map([['nwac:48', { observedAt }]]))
    fetchStationTimeseriesMock.mockResolvedValue(response([{ ...stale, variables: ['air_temp'] }]))

    const kept = await withStaleStations('nwac', response([{ ...stale, variables: [] }]), [stale])

    expect(kept.stale).toEqual(['nwac:48'])
  })
})

describe('fetchLastReports', () => {
  const observedAt = '2026-10-18T12:00:00Z'

  it('dates only the stations silent in the default window, from the tracking feed', async () => {
    fetchCurrentObservationsMock.mockResolvedValue(new Map([['nwac:48', { observedAt }]]))
    fetchStationTimeseriesMock.mockResolvedValue(
      response([
        { ...live, variables: ['air_temp'] },
        { ...stale, variables: [] },
      ]),
    )

    expect(await fetchLastReports('nwac', [live, stale])).toEqual({ 'nwac:48': observedAt })
  })

  it('leaves the page without dates when the lookup fails', async () => {
    fetchStationTimeseriesMock.mockRejectedValue(new Error('down'))

    expect(await fetchLastReports('nwac', [live])).toEqual({})
  })
})
