import type { WeatherTable } from '@/services/nac/model/forecast'
import { orderWeatherTables } from '@/services/nac/orderWeatherTables'

function table(zoneId: string, zoneName: string): WeatherTable {
  return { zone_id: zoneId, zone_name: zoneName, columns: [], rows: [], data: [] }
}

describe('orderWeatherTables', () => {
  // SNFAC's real shape: the product lists its tables by the center's short zone_id, and the
  // center's zone order (rank) is not the order the product carries them in.
  const zones = [
    { zone_id: '3', rank: 1 },
    { zone_id: '4', rank: 2 },
    { zone_id: '2', rank: 3 },
    { zone_id: '1', rank: 4 },
  ]

  it('orders tables by the center zone rank, matching on the short zone_id', () => {
    const tables = [
      table('1', 'Banner'),
      table('2', 'Sawtooth'),
      table('3', 'Galena'),
      table('4', 'Soldier'),
    ]

    expect(orderWeatherTables(tables, zones).map((t) => t.zone_name)).toEqual([
      'Galena',
      'Soldier',
      'Sawtooth',
      'Banner',
    ])
  })

  it('sorts a table for a zone the center no longer lists last, keeping its original position', () => {
    const tables = [table('9', 'Retired A'), table('1', 'Banner'), table('8', 'Retired B')]

    expect(orderWeatherTables(tables, zones).map((t) => t.zone_name)).toEqual([
      'Banner',
      'Retired A',
      'Retired B',
    ])
  })

  it('treats an unranked zone like an unknown one', () => {
    const tables = [table('x', 'Unranked'), table('1', 'Banner')]

    expect(
      orderWeatherTables(tables, [...zones, { zone_id: 'x', rank: null }]).map((t) => t.zone_name),
    ).toEqual(['Banner', 'Unranked'])
  })

  it('does not mutate its input', () => {
    const tables = [table('1', 'Banner'), table('3', 'Galena')]
    orderWeatherTables(tables, zones)
    expect(tables.map((t) => t.zone_name)).toEqual(['Banner', 'Galena'])
  })
})
