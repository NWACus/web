import {
  readColorRulesPref,
  readSortPref,
  readUnitsPref,
  writeColorRulesPref,
  writeSortPref,
  writeUnitsPref,
} from '@/components/stationMap/stationMapPrefs'

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

describe("the table's saved sort and color toggle", () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trip per center, beside units', () => {
    writeUnitsPref('sac', 'metric')
    writeSortPref('sac', { column: 'air_temp', direction: 'desc' })
    writeColorRulesPref('sac', false)

    expect(readUnitsPref('sac')).toBe('metric')
    expect(readSortPref('sac')).toEqual({ column: 'air_temp', direction: 'desc' })
    expect(readColorRulesPref('sac')).toBe(false)
    expect(readSortPref('nwac')).toBeUndefined()
    expect(readColorRulesPref('nwac')).toBeUndefined()
  })

  it('ignores a malformed sort', () => {
    window.localStorage.setItem(
      'avyweb-station-map-sac',
      '{"sort":{"column":"air_temp","direction":"sideways"},"colorRules":"yes"}',
    )
    expect(readSortPref('sac')).toBeUndefined()
    expect(readColorRulesPref('sac')).toBeUndefined()
  })
})
