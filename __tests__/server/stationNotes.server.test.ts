import { stationNotes } from '../../src/services/snowobs/tableHelpers'
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

function responseWith(stations: unknown[]): SnowObsTimeseriesResponse {
  const response = { UNITS: {}, VARIABLES: [], STATION: stations }
  if (!isTimeseriesResponse(response)) throw new Error('bad fixture')
  return response
}

function isTimeseriesResponse(value: unknown): value is SnowObsTimeseriesResponse {
  return typeof value === 'object' && value !== null && 'STATION' in value
}

describe('stationNotes', () => {
  it('keeps active and static notes, active first, and drops the rest', () => {
    const response = responseWith([
      station('44', 'Timberline Lodge', [
        {
          status: 'static',
          note: 'The Timberline precipitation gauge continues to under-report.',
          start_date: '2021-12-01T08:00:00Z',
          end_date: null,
        },
        { status: 'retired', note: 'Old sensor removed.', start_date: null, end_date: null },
        {
          status: 'active',
          note: 'The precipitation gauge is not recording correctly.',
          start_date: '2026-02-25T08:00:00Z',
          end_date: null,
        },
      ]),
    ])

    expect(stationNotes(response.STATION)).toEqual([
      {
        stid: '44',
        stationName: 'Timberline Lodge',
        note: 'The precipitation gauge is not recording correctly.',
        status: 'active',
        startDate: '2026-02-25T08:00:00Z',
      },
      {
        stid: '44',
        stationName: 'Timberline Lodge',
        note: 'The Timberline precipitation gauge continues to under-report.',
        status: 'static',
        startDate: '2021-12-01T08:00:00Z',
      },
    ])
  })

  it('ignores blank notes and stations carrying none', () => {
    const response = responseWith([
      station('4', 'Hurricane Ridge', []),
      station('5', 'Heather Meadows', [{ status: 'active', note: '   ', start_date: null }]),
    ])
    expect(stationNotes(response.STATION)).toEqual([])
  })

  it('drops a note once its end date has passed', () => {
    const now = new Date('2026-09-15T00:00:00Z')
    const response = responseWith([
      station('44', 'Timberline Lodge', [
        { status: 'active', note: 'Over.', start_date: null, end_date: '2026-09-01T00:00:00Z' },
        { status: 'active', note: 'Still on.', start_date: null, end_date: '2026-10-01T00:00:00Z' },
        { status: 'static', note: 'Open ended.', start_date: null, end_date: null },
        { status: 'active', note: 'Bad date.', start_date: null, end_date: 'soon' },
      ]),
    ])
    expect(stationNotes(response.STATION, now).map((n) => n.note)).toEqual([
      'Still on.',
      'Bad date.',
      'Open ended.',
    ])
  })

  it('orders notes newest first, undated last', () => {
    const response = responseWith([
      station('44', 'Timberline Lodge', [
        { status: 'active', note: 'Undated.', start_date: null },
        { status: 'active', note: 'Old.', start_date: '2021-12-01T08:00:00Z' },
        { status: 'active', note: 'New.', start_date: '2026-02-25T08:00:00Z' },
      ]),
    ])
    expect(stationNotes(response.STATION).map((n) => n.note)).toEqual(['New.', 'Old.', 'Undated.'])
  })
})
