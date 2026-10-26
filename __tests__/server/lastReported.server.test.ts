const fetchStationTimeseriesMock = jest.fn()
jest.mock('../../src/services/snowobs/snowobs', () => ({
  fetchStationTimeseries: (...args: unknown[]) => fetchStationTimeseriesMock(...args),
}))

import { fetchLastReported, latestObservationTime } from '../../src/services/snowobs/lastReported'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

function responseWith(...dateTimes: string[][]): SnowObsTimeseriesResponse {
  return {
    UNITS: {},
    VARIABLES: [],
    STATION: dateTimes.map((times, i) => ({
      id: String(i),
      stid: String(i),
      source: 'nwac',
      observations: { date_time: times },
    })),
  }
}

const empty = responseWith()
const station = [{ stid: '40', source: 'nwac' }]

beforeEach(() => fetchStationTimeseriesMock.mockReset())

describe('latestObservationTime', () => {
  it('takes the newest time across stations', () => {
    const response = responseWith(
      ['2026-05-13T00:00:00Z', '2026-05-14T17:00:00Z'],
      ['2026-05-10T00:00:00Z'],
    )
    expect(latestObservationTime(response)).toBe(Date.parse('2026-05-14T17:00:00Z'))
  })

  it('is null when nothing reported', () => {
    expect(latestObservationTime(empty)).toBeNull()
  })
})

describe('fetchLastReported', () => {
  const now = new Date('2026-10-07T12:00:00Z')

  it('walks back month by month until a window has data', async () => {
    fetchStationTimeseriesMock
      .mockResolvedValueOnce(empty)
      .mockResolvedValueOnce(empty)
      .mockResolvedValueOnce(responseWith(['2026-05-14T17:00:00Z']))

    const last = await fetchLastReported('nwac', station, now)

    expect(last?.toISOString()).toBe('2026-05-14T17:00:00.000Z')
    expect(fetchStationTimeseriesMock).toHaveBeenCalledTimes(3)
  })

  it('gives up after two years of empty windows', async () => {
    fetchStationTimeseriesMock.mockResolvedValue(empty)
    expect(await fetchLastReported('nwac', station, now)).toBeNull()
    expect(fetchStationTimeseriesMock).toHaveBeenCalledTimes(24)
  })

  it('is null when SnowObs fails', async () => {
    fetchStationTimeseriesMock.mockRejectedValue(new Error('down'))
    expect(await fetchLastReported('nwac', station, now)).toBeNull()
  })
})
