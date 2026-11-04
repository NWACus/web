import { addStaleStations } from '@/services/stations/staleStations'

describe('addStaleStations', () => {
  const live = {
    UNITS: { air_temp: 'Fahrenheit' },
    VARIABLES: [{ variable: 'air_temp', long_name: 'Air Temperature' }],
    STATION: [
      {
        id: '1',
        stid: '1',
        source: 'nwac',
        name: 'Live',
        observations: { date_time: ['2026-11-03T12:00:00Z'], air_temp: [30] },
      },
    ],
  }
  const lastDay = {
    UNITS: { air_temp: 'Celsius', wind_direction: 'degrees' },
    VARIABLES: [
      { variable: 'air_temp', long_name: 'Air Temperature' },
      { variable: 'wind_direction', long_name: 'Wind Direction' },
    ],
    STATION: [
      {
        id: '2',
        stid: '2',
        source: 'nwac',
        name: 'Stale',
        elevation: 5000,
        observations: {
          date_time: ['2026-11-02T12:00:00Z'],
          air_temp: [28],
          wind_direction: [90],
        },
      },
    ],
  }
  const station = { stid: '2', source: 'nwac' }
  const observedAt = '2026-11-02T12:00:00Z'

  it('keeps the station and its readings but none of its values', () => {
    const { response, stale } = addStaleStations(live, [{ station, observedAt, response: lastDay }])

    expect(response.STATION[1]).toMatchObject({
      stid: '2',
      elevation: 5000,
      observations: { date_time: [], air_temp: [], wind_direction: [] },
    })
    expect(stale).toEqual([{ name: 'Stale', lastReported: observedAt }])
  })

  it("adds the station's units and names without overriding the response's", () => {
    const { response } = addStaleStations(live, [{ station, observedAt, response: lastDay }])

    expect(response.UNITS).toEqual({ air_temp: 'Fahrenheit', wind_direction: 'degrees' })
    expect(response.VARIABLES.map((v) => v.variable)).toEqual(['air_temp', 'wind_direction'])
  })

  it('replaces an empty entry for the station rather than listing it twice', () => {
    const blank = { id: '2', stid: '2', source: 'nwac', observations: {} }
    const { response } = addStaleStations({ ...live, STATION: [...live.STATION, blank] }, [
      { station, observedAt, response: lastDay },
    ])

    expect(response.STATION.map((s) => s.stid)).toEqual(['1', '2'])
  })

  it('leaves the response alone when the last day lacks the station', () => {
    const { response, stale } = addStaleStations(live, [
      { station, observedAt, response: { ...lastDay, STATION: [] } },
    ])

    expect(response).toBe(live)
    expect(stale).toEqual([])
  })
})
