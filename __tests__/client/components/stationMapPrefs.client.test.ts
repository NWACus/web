import { readUnitsPref, writeUnitsPref } from '@/components/stationMap/stationMapPrefs'

describe('the units preference', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips', () => {
    writeUnitsPref('nwac', 'metric')
    expect(readUnitsPref('nwac')).toBe('metric')
  })

  it('keeps each center separate', () => {
    writeUnitsPref('nwac', 'metric')
    expect(readUnitsPref('sac')).toBeUndefined()
  })

  it('ignores a stale or hand-edited entry', () => {
    window.localStorage.setItem('avyweb-station-map-nwac', '{"units":"furlongs"}')
    expect(readUnitsPref('nwac')).toBeUndefined()

    window.localStorage.setItem('avyweb-station-map-nwac', 'not json')
    expect(readUnitsPref('nwac')).toBeUndefined()
  })

  /**
   * Readers carry an entry from when this key also held the marker label, the recency filter and
   * the last viewport. Those live in the URL now; the leftovers are ignored, and the next write
   * clears them.
   */
  it('ignores what the old entry kept beside units, and drops it on the next write', () => {
    window.localStorage.setItem(
      'avyweb-station-map-nwac',
      '{"units":"metric","variable":"air_temp","withinMinutes":60,"zoom":8,"center":{"lat":47,"lng":-121}}',
    )
    expect(readUnitsPref('nwac')).toBe('metric')

    writeUnitsPref('nwac', 'english')

    expect(JSON.parse(window.localStorage.getItem('avyweb-station-map-nwac') ?? 'null')).toEqual({
      units: 'english',
    })
  })
})
