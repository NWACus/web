import { stationStatus } from '@/fields/stations/status'

const now = new Date('2026-09-18T20:00:00Z')
const station = (observedAt: string | null) => ({
  stid: '1',
  source: 'nwac',
  name: 'Alpental Base',
  elevation: 3100,
  partner: null,
  variables: observedAt ? ['air_temp'] : [],
  observedAt,
  tracked: true,
})

describe('stationStatus', () => {
  it('is current when the latest observation is recent', () => {
    expect(stationStatus(station('2026-09-18T19:00:00Z'), now)).toBe('current')
  })

  it('is stale when the latest observation is older than the cutoff', () => {
    expect(stationStatus(station('2026-09-18T10:00:00Z'), now)).toBe('stale')
  })

  it('is unknown when the station has no current observation', () => {
    expect(stationStatus(station(null), now)).toBe('unknown')
  })

  it('is untracked when SnowObs no longer lists the station, listed or not', () => {
    expect(stationStatus(undefined, now)).toBe('untracked')
    expect(stationStatus({ ...station('2026-09-18T19:00:00Z'), tracked: false }, now)).toBe(
      'untracked',
    )
  })
})
