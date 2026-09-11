import {
  clearStationMapPrefs,
  readStationMapPrefs,
  readZoneParam,
  withZoneParam,
  writeStationMapPrefs,
} from '@/components/stationMap/stationMapPrefs'

describe('station map preferences', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips the fields the widget persisted', () => {
    writeStationMapPrefs('nwac', { variable: 'air_temp', withinMinutes: 60, units: 'metric' })
    writeStationMapPrefs('nwac', { center: { lat: 47, lng: -121 }, zoom: 8 })

    expect(readStationMapPrefs('nwac')).toEqual({
      variable: 'air_temp',
      withinMinutes: 60,
      units: 'metric',
      center: { lat: 47, lng: -121 },
      zoom: 8,
    })
  })

  it('keeps each center separate', () => {
    writeStationMapPrefs('nwac', { variable: 'air_temp' })
    expect(readStationMapPrefs('sac')).toEqual({})
  })

  it('ignores a stale or hand-edited entry', () => {
    window.localStorage.setItem(
      'avyweb-station-map-nwac',
      '{"units":"furlongs","zoom":"far","center":{"lat":1}}',
    )
    expect(readStationMapPrefs('nwac')).toEqual({})

    window.localStorage.setItem('avyweb-station-map-nwac', 'not json')
    expect(readStationMapPrefs('nwac')).toEqual({})
  })

  it('clears', () => {
    writeStationMapPrefs('nwac', { variable: 'air_temp' })
    clearStationMapPrefs('nwac')
    expect(readStationMapPrefs('nwac')).toEqual({})
  })
})

describe('the zone filter in the URL', () => {
  it('reads repeated zone params', () => {
    expect(readZoneParam('?zone=Olympics&zone=Mt+Hood&other=1')).toEqual(['Olympics', 'Mt Hood'])
    expect(readZoneParam('')).toEqual([])
  })

  it('replaces the zone params and keeps the rest', () => {
    expect(withZoneParam('?zone=Olympics&other=1', ['Mt Hood'])).toBe('?other=1&zone=Mt+Hood')
    expect(withZoneParam('?zone=Olympics', [])).toBe('')
  })
})

describe('the recency preference', () => {
  beforeEach(() => window.localStorage.clear())

  it('ignores a recency the filter does not offer', () => {
    window.localStorage.setItem('avyweb-station-map-nwac', '{"withinMinutes":90}')
    expect(readStationMapPrefs('nwac')).toEqual({})
  })
})
