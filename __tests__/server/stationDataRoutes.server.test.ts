jest.mock('../../src/payload.config', () => ({}))
jest.mock('payload', () => ({
  getPayload: jest.fn(async () => ({ logger: { warn: jest.fn(), error: jest.fn() } })),
}))

const nwac1 = { stid: '1', source: 'nwac' }

jest.mock('../../src/services/stations/getStationPages', () => ({
  getStationPages: jest.fn(async () => [
    { slug: 'alpental', displayName: 'Alpental', archived: false, stations: [nwac1], columns: [] },
  ]),
  allStations: () => new Map([['nwac:1', nwac1]]),
}))
jest.mock('../../src/services/snowobs/snowobs', () => ({
  ...jest.requireActual('../../src/services/snowobs/snowobs'),
  fetchStationTimeseries: jest.fn(async () => ({ UNITS: {}, VARIABLES: [], STATION: [] })),
}))
jest.mock('../../src/services/snowobs/access', () => ({
  ...jest.requireActual('../../src/services/snowobs/access'),
  resolveSnowObsAccess: jest.fn(async () => ({ token: 't', ownSources: ['nwac'] })),
}))
jest.mock('../../src/services/snowobs/stationTracking', () => ({
  fetchTrackedStations: jest.fn(async () => [nwac1]),
  fetchVariableRounding: jest.fn(async () => ({})),
}))

jest.mock('../../src/services/stations/reportedReadings', () => ({
  withStaleStations: jest.fn(async (_center: string, response: unknown) => ({
    response,
    stale: [],
  })),
}))

import { GET as getGraphData } from '@/app/(frontend)/[center]/weather/graph-data/route'
import { GET as getPrecipData } from '@/app/(frontend)/[center]/weather/precip-data/route'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { withStaleStations } from '@/services/stations/reportedReadings'

const params = Promise.resolve({ center: 'nwac' })

// Readers must stay within about two minutes of SnowObs.
describe('station data routes', () => {
  it('graph-data caches a minute at the CDN', async () => {
    const query = new URLSearchParams({
      stations: 'nwac:1',
      vars: 'air_temp',
      from: '2026-09-27T10:00:00Z',
      to: '2026-09-28T10:00:00Z',
    })
    const res = await getGraphData(new Request(`https://x/weather/graph-data?${query}`), {
      params,
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=60')
  })

  it("graph-data reads SnowObs's metric units when asked", async () => {
    const query = new URLSearchParams({
      stations: 'nwac:1',
      vars: 'air_temp',
      from: '2026-09-27T10:00:00Z',
      to: '2026-09-28T10:00:00Z',
      units: 'metric',
    })
    await getGraphData(new Request(`https://x/weather/graph-data?${query}`), { params })
    expect(fetchStationTimeseries).toHaveBeenLastCalledWith(
      'nwac',
      [nwac1],
      expect.objectContaining({ units: 'metric' }),
    )
  })

  describe('graph-data at 00:30 Pacific', () => {
    const graphAt = (to: string) => {
      const query = new URLSearchParams({
        stations: 'nwac:1',
        vars: 'air_temp',
        from: '2026-10-18T07:00:00Z',
        to,
      })
      return getGraphData(new Request(`https://x/weather/graph-data?${query}`), { params })
    }

    beforeEach(() => {
      jest.useFakeTimers({ now: new Date('2026-10-20T07:30:00Z') })
      jest.mocked(withStaleStations).mockClear()
    })
    afterEach(() => jest.useRealTimers())

    it('keeps stale stations for a range ending now', async () => {
      await graphAt('2026-10-20T07:30:00Z')
      expect(withStaleStations).toHaveBeenCalled()
    })

    it('skips them for a custom range that ended at 23:59 yesterday', async () => {
      await graphAt('2026-10-20T06:59:00Z')
      expect(withStaleStations).not.toHaveBeenCalled()
    })
  })

  it('precip-data caches a minute at the CDN', async () => {
    const res = await getPrecipData(new Request('https://x/weather/precip-data?stations=nwac:1'), {
      params,
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=60')
  })

  it('precip-data reads the requested units, default when absent', async () => {
    await getPrecipData(new Request('https://x/weather/precip-data?stations=nwac:1'), { params })
    expect(fetchStationTimeseries).toHaveBeenLastCalledWith(
      'nwac',
      [nwac1],
      expect.objectContaining({ units: 'default' }),
    )
    await getPrecipData(new Request('https://x/weather/precip-data?stations=nwac:1&units=metric'), {
      params,
    })
    expect(fetchStationTimeseries).toHaveBeenLastCalledWith(
      'nwac',
      [nwac1],
      expect.objectContaining({ units: 'metric' }),
    )
  })

  it('precip-data rejects an unknown unit system', async () => {
    const res = await getPrecipData(
      new Request('https://x/weather/precip-data?stations=nwac:1&units=kelvin'),
      { params },
    )
    expect(res.status).toBe(400)
  })

  // A retired gauge left on a block must not blank the rest of the table.
  it('precip-data skips a station the center does not track', async () => {
    jest.mocked(fetchStationTimeseries).mockClear()
    const res = await getPrecipData(
      new Request('https://x/weather/precip-data?stations=nwac:1,nwac:40'),
      { params },
    )
    expect(res.status).toBe(200)
    expect(fetchStationTimeseries).toHaveBeenCalledWith('nwac', [nwac1], expect.anything())
  })

  it('precip-data answers an empty table when no station is tracked', async () => {
    jest.mocked(fetchStationTimeseries).mockClear()
    const res = await getPrecipData(new Request('https://x/weather/precip-data?stations=nwac:40'), {
      params,
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      rows: [],
      timezoneLabel: '',
      latestObservation: null,
      latestDisplay: null,
      unit: '',
      decimals: 0,
    })
    expect(fetchStationTimeseries).not.toHaveBeenCalled()
  })
})
