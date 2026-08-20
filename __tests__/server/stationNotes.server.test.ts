import { activeNotesByStid, activeStationNotes } from '../../src/services/snowobs/stationNotes'
import type { SnowObsTimeseriesResponse } from '../../src/services/snowobs/types/schemas'

function station(stid: string, name: string, notes: unknown[]): unknown {
  return {
    id: stid,
    stid,
    name,
    latitude: null,
    longitude: null,
    elevation: null,
    observations: {},
    station_note: notes,
  }
}

// Shaped after the real SnowObs payload for Timberline (stid 44), which has
// carried an active precipitation-gauge note since February 2026 alongside a
// long-standing static one.
function responseWith(stations: unknown[]): SnowObsTimeseriesResponse {
  const response = { UNITS: {}, VARIABLES: [], STATION: stations }
  if (!isTimeseriesResponse(response)) throw new Error('bad fixture')
  return response
}

function isTimeseriesResponse(value: unknown): value is SnowObsTimeseriesResponse {
  return typeof value === 'object' && value !== null && 'STATION' in value
}

describe('activeStationNotes', () => {
  it('keeps active notes and drops static site characteristics', () => {
    const response = responseWith([
      station('44', 'Timberline Lodge', [
        {
          status: 'static',
          note: 'The Timberline precipitation gauge continues to under-report.',
          start_date: '2021-12-01T08:00:00Z',
          end_date: null,
        },
        {
          status: 'active',
          note: 'The precipitation gauge is not recording correctly.',
          start_date: '2026-02-25T08:00:00Z',
          end_date: null,
        },
      ]),
    ])

    expect(activeStationNotes(response)).toEqual([
      {
        stid: '44',
        stationName: 'Timberline Lodge',
        note: 'The precipitation gauge is not recording correctly.',
        startDate: '2026-02-25T08:00:00Z',
      },
    ])
  })

  it('ignores blank notes and stations carrying none', () => {
    const response = responseWith([
      station('4', 'Hurricane Ridge', []),
      station('5', 'Heather Meadows', [{ status: 'active', note: '   ', start_date: null }]),
    ])
    expect(activeStationNotes(response)).toEqual([])
  })

  it('groups several notes under one station', () => {
    const response = responseWith([
      station('20', 'Mt. Washington', [
        { status: 'active', note: 'Communications are intermittent.', start_date: null },
        { status: 'active', note: 'WSDOT is working on a solution.', start_date: null },
      ]),
    ])
    expect(activeNotesByStid(response).get('20')).toHaveLength(2)
  })
})
