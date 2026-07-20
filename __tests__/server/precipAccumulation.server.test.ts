import { buildPrecipAccumulationTable } from '../../src/services/snowobs/transform'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

// Three stations: one reporting normally, one lagging (stale lastUpdate but
// sums anchored to the NEWEST observation anywhere), one silent ("missing").
const HOUR = 60 * 60 * 1000
const ANCHOR = new Date('2026-07-07T12:00:00Z').getTime()
const iso = (hoursBack: number) => new Date(ANCHOR - hoursBack * HOUR).toISOString()

const response: SnowObsTimeseriesResponse = {
  UNITS: { precip_accum_one_hour: 'inches' },
  VARIABLES: [{ variable: 'precip_accum_one_hour', long_name: 'Precipitation' }],
  STATION: [
    {
      id: '1',
      stid: '1',
      name: 'North Fresh',
      latitude: 48.5,
      longitude: -121.5,
      elevation: 4000,
      observations: {
        // Hourly for the last 6 hours: 0.1 each, with one null gap.
        date_time: [iso(5), iso(4), iso(3), iso(2), iso(1), iso(0)],
        precip_accum_one_hour: [0.1, 0.1, null, 0.1, 0.1, 0.1],
      },
    },
    {
      id: '2',
      stid: '2',
      name: 'South Lagging',
      latitude: 46.2,
      longitude: -121.7,
      elevation: 5000,
      observations: {
        // Last report 30h before the anchor — outside 24H, inside 48H/72H.
        date_time: [iso(31), iso(30)],
        precip_accum_one_hour: [0.2, 0.3],
      },
    },
    {
      id: '3',
      stid: '3',
      name: 'Mid Silent',
      latitude: 47.4,
      longitude: -121.4,
      elevation: 3000,
      observations: {
        date_time: [],
        precip_accum_one_hour: [],
      },
    },
  ],
}

describe('buildPrecipAccumulationTable', () => {
  const table = buildPrecipAccumulationTable(response, ['1', '2', '3'])

  const rowFor = (stid: string) => {
    const row = table.rows.find((r) => r.stid === stid)
    if (!row) throw new Error(`missing row for stid ${stid}`)
    return row
  }

  it('sorts rows north to south by latitude', () => {
    expect(table.rows.map((r) => r.name)).toEqual(['North Fresh', 'Mid Silent', 'South Lagging'])
  })

  it('sums trailing windows with null passthrough', () => {
    const fresh = rowFor('1')
    // 1H window: only the anchor-time ob.
    expect(fresh.totals[1]).toBe(0.1)
    // 3H: obs at 0,1,2 hours back = 0.3 (the null at 3h back is skipped by cutoff).
    expect(fresh.totals[3]).toBe(0.3)
    // 6H..72H: all five non-null obs.
    expect(fresh.totals[6]).toBe(0.5)
    expect(fresh.totals[72]).toBe(0.5)
    expect(fresh.hasData).toBe(true)
  })

  it('anchors windows to the newest observation anywhere, not per station', () => {
    const lagging = rowFor('2')
    // Nothing inside 24H of the anchor -> null, not 0.
    expect(lagging.totals[24]).toBeNull()
    // Both obs inside 48H.
    expect(lagging.totals[48]).toBe(0.5)
    expect(lagging.hasData).toBe(true)
    expect(lagging.lastUpdate).not.toBe('')
  })

  it('marks stations with no observations as missing', () => {
    const silent = rowFor('3')
    expect(silent.hasData).toBe(false)
    expect(silent.totals[72]).toBeNull()
    expect(silent.lastUpdate).toBe('')
  })

  it('dedupes requested stids and skips stations absent from the response', () => {
    const dup = buildPrecipAccumulationTable(response, ['1', '1', 'nope'])
    expect(dup.rows).toHaveLength(1)
  })
})
