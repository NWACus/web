// The adapter's runtime pulls in Payload's env loader, which Jest can't run; the data move needs only `sql`'s name.
jest.mock('@payloadcms/db-sqlite', () => ({ sql: () => ({}) }))

import { moveReadings } from '../../src/migrations/20261017_214607_station_columns_per_station'

const stations = JSON.stringify([
  { stid: '1', source: 'nwac' },
  { stid: '2', source: 'snotel', extra: true },
  { stid: 3 },
])

describe('moveReadings', () => {
  it("copies a page's readings onto each station and keeps the default order empty", () => {
    expect(moveReadings(stations, ['air_temp', 'snow_depth'])).toEqual({
      stations: [
        { stid: '1', source: 'nwac', columns: ['air_temp', 'snow_depth'] },
        { stid: '2', source: 'snotel', columns: ['air_temp', 'snow_depth'] },
      ],
      columnOrder: [],
    })
  })

  it('turns a reordering into one entry per reading and station, readings first', () => {
    expect(moveReadings(stations, ['snow_depth', 'air_temp']).columnOrder).toEqual([
      { stid: '1', source: 'nwac', variable: 'snow_depth' },
      { stid: '2', source: 'snotel', variable: 'snow_depth' },
      { stid: '1', source: 'nwac', variable: 'air_temp' },
      { stid: '2', source: 'snotel', variable: 'air_temp' },
    ])
  })

  it('treats missing stations as none', () => {
    expect(moveReadings(null, ['air_temp'])).toEqual({ stations: [], columnOrder: [] })
  })
})
