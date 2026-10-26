jest.mock('../../src/payload.config', () => ({}))
jest.mock('payload', () => ({ getPayload: jest.fn() }))

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
}))

import { GET as getGraphData } from '@/app/(frontend)/[center]/weather/graph-data/route'
import { GET as getPrecipData } from '@/app/(frontend)/[center]/weather/precip-data/route'

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

  it('precip-data caches a minute at the CDN', async () => {
    const res = await getPrecipData(new Request('https://x/weather/precip-data?stations=nwac:1'), {
      params,
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=60')
  })
})
