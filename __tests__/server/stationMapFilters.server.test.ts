import {
  DEFAULT_FILTERS,
  SHOW_ALL_WITHIN,
  dataSources,
  filterStations,
  filterWebcams,
  isFilterActive,
  orderedPoints,
  type StationAges,
} from '@/services/snowobs/stationMap/filters'
import type { StationMapStation, StationMapWebcam } from '@/services/snowobs/stationMap/model'

function station(overrides: Partial<StationMapStation>): StationMapStation {
  return {
    stid: '1',
    name: 'Station',
    source: 'nwac',
    coordinates: [-121, 47],
    elevation: 3000,
    observedAt: '2026-09-10T22:00:00Z',
    data: { air_temp: 40 },
    zone: 'Olympics',
    href: null,
    ...overrides,
  }
}

function webcam(overrides: Partial<StationMapWebcam>): StationMapWebcam {
  return {
    id: 1,
    title: 'Cam',
    coordinates: [-121, 47],
    images: [],
    zone: 'Olympics',
    ...overrides,
  }
}

const fresh = station({
  stid: 'fresh',
  source: 'nwac',
  zone: 'Olympics',
  data: { air_temp: 40, wind_speed: 5 },
})
const stale = station({ stid: 'stale', source: 'snotel', zone: 'Mt Hood', data: { air_temp: 30 } })
const noWind = station({
  stid: 'nowind',
  source: 'synoptic-data',
  zone: 'Olympics',
  data: { air_temp: 35, wind_speed: null },
})
const never = station({ stid: 'never', observedAt: null, data: {} })

const ages: StationAges = new Map([
  ['fresh', 30],
  ['stale', 500],
  ['nowind', 10],
  ['never', Infinity],
])
const stations = [fresh, stale, noWind, never]

describe('filterStations', () => {
  it('shows everything by default', () => {
    expect(filterStations(stations, DEFAULT_FILTERS, ages)).toEqual(stations)
  })

  it('hides stations whose reading is older than the recency limit', () => {
    const shown = filterStations(stations, { ...DEFAULT_FILTERS, withinMinutes: 60 }, ages)
    expect(shown.map((s) => s.stid)).toEqual(['fresh', 'nowind'])
  })

  it('hides a station that has never reported under any recency limit', () => {
    const shown = filterStations(stations, { ...DEFAULT_FILTERS, withinMinutes: 1440 }, ages)
    expect(shown.map((s) => s.stid)).not.toContain('never')
  })

  it('keeps one source when the legend picks one', () => {
    const shown = filterStations(stations, { ...DEFAULT_FILTERS, source: 'snotel' }, ages)
    expect(shown.map((s) => s.stid)).toEqual(['stale'])
  })

  it('hides stations with no reading for the labelled variable', () => {
    const shown = filterStations(stations, { ...DEFAULT_FILTERS, variable: 'wind_speed' }, ages)
    expect(shown.map((s) => s.stid)).toEqual(['fresh'])
  })

  it('keeps only the chosen zones', () => {
    const shown = filterStations(stations, { ...DEFAULT_FILTERS, zones: ['Mt Hood'] }, ages)
    expect(shown.map((s) => s.stid)).toEqual(['stale'])
  })

  it('shows no stations when the type is webcams', () => {
    expect(filterStations(stations, { ...DEFAULT_FILTERS, type: 'webcams' }, ages)).toEqual([])
  })
})

describe('filterWebcams', () => {
  const cams = [webcam({ id: 1, zone: 'Olympics' }), webcam({ id: 2, zone: 'Mt Hood' })]

  it('shows every webcam by default', () => {
    expect(filterWebcams(cams, DEFAULT_FILTERS)).toEqual(cams)
  })

  it('hides webcams when markers are labelled by a variable', () => {
    expect(filterWebcams(cams, { ...DEFAULT_FILTERS, variable: 'air_temp' })).toEqual([])
  })

  it('hides webcams when the type is stations', () => {
    expect(filterWebcams(cams, { ...DEFAULT_FILTERS, type: 'stations' })).toEqual([])
  })

  it('keeps only the chosen zones', () => {
    expect(
      filterWebcams(cams, { ...DEFAULT_FILTERS, zones: ['Mt Hood'] }).map((c) => c.id),
    ).toEqual([2])
  })
})

describe('isFilterActive', () => {
  it('is off by default and ignores the units setting', () => {
    expect(isFilterActive(DEFAULT_FILTERS)).toBe(false)
    expect(isFilterActive({ ...DEFAULT_FILTERS, units: 'metric' })).toBe(false)
  })

  it.each([
    { variable: 'air_temp' },
    { withinMinutes: 60 },
    { source: 'nwac' },
    { type: 'stations' as const },
    { zones: ['Olympics'] },
  ])('is on for %o', (patch) => {
    expect(isFilterActive({ ...DEFAULT_FILTERS, ...patch })).toBe(true)
  })

  it('treats the show-all recency sentinel as off', () => {
    expect(isFilterActive({ ...DEFAULT_FILTERS, withinMinutes: SHOW_ALL_WITHIN })).toBe(false)
  })
})

describe('orderedPoints', () => {
  it('orders by zone, then north-west to south-east within a zone', () => {
    const northWest = station({ stid: 'nw', zone: 'B', coordinates: [-122, 48] })
    const southEast = station({ stid: 'se', zone: 'B', coordinates: [-120, 46] })
    const otherZone = station({ stid: 'a', zone: 'A', coordinates: [-121, 47] })
    const cam = webcam({ id: 9, zone: 'B', coordinates: [-121, 47] })

    const ids = orderedPoints([southEast, northWest, otherZone], [cam]).map((point) => point.id)
    expect(ids).toEqual(['station-a', 'station-nw', 'webcam-9', 'station-se'])
  })
})

describe('dataSources', () => {
  it('lists each source once, in first-seen order', () => {
    expect(dataSources(stations)).toEqual(['nwac', 'snotel', 'synoptic-data'])
  })
})
