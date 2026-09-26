/**
 * The station map's state in the URL — the filters and the viewport, so a reader can bookmark or
 * share what they are looking at. Defaults are left off, so an untouched map has a clean link.
 */
import {
  dropViewParam,
  pushDisplayParam,
  readDisplayRequest,
  readFilterParams,
  readLegacyHashZones,
  readViewParam,
  writeDisplayParam,
  writeFilterParams,
  writeViewParam,
} from '@/components/stationMap/stationMapUrl'
import { DEFAULT_FILTERS, type StationMapFilters } from '@/services/snowobs/stationMap/filters'

/** jsdom starts every test at the same URL; the map only ever uses `replaceState`. */
function atUrl(search: string) {
  window.history.replaceState(null, '', `/weather/stations/map${search}`)
}

describe('reading the filters from a link', () => {
  it('takes what the link asks for, over the defaults', () => {
    const filters = readFilterParams(
      '?variable=air_temp&within=60&source=snotel&type=webcams&zone=Olympics&zone=Mt+Hood',
      'metric',
    )

    expect(filters).toEqual({
      variable: 'air_temp',
      withinMinutes: 60,
      units: 'metric',
      source: 'snotel',
      type: 'webcams',
      zones: ['Olympics', 'Mt Hood'],
    })
  })

  // Units comes from the reader's own preference, so a shared link never imposes it.
  it('defaults everything a bare link leaves out, and takes units from the caller', () => {
    expect(readFilterParams('', 'english')).toEqual({ ...DEFAULT_FILTERS, units: 'english' })
  })

  it('ignores a recency or a type the filter does not offer', () => {
    const filters = readFilterParams('?within=90&type=submarines', 'default')

    expect(filters.withinMinutes).toBe(DEFAULT_FILTERS.withinMinutes)
    expect(filters.type).toBeNull()
  })
})

describe('writing the filters to the link', () => {
  const active: StationMapFilters = {
    variable: 'air_temp',
    withinMinutes: 60,
    units: 'metric',
    source: 'snotel',
    type: 'stations',
    zones: ['Olympics', 'Mt Hood'],
  }

  it('round-trips through the URL', () => {
    atUrl('')
    writeFilterParams(active)

    expect(readFilterParams(window.location.search, 'metric')).toEqual(active)
  })

  // Units is the reader's, not the link's — it has no business in a URL somebody else may open.
  it('leaves units off', () => {
    atUrl('')
    writeFilterParams(active)

    expect(window.location.search).not.toContain('units')
  })

  it('writes nothing for the defaults', () => {
    atUrl('?variable=air_temp&within=60')
    writeFilterParams(DEFAULT_FILTERS)

    expect(window.location.search).toBe('')
  })

  it('keeps params it does not own', () => {
    atUrl('?at=47.0000,-121.0000,8.00&utm_source=email')
    writeFilterParams({ ...DEFAULT_FILTERS, zones: ['Olympics'] })

    expect(readViewParam(window.location.search)).toEqual({
      center: { lat: 47, lng: -121 },
      zoom: 8,
    })
    expect(window.location.search).toContain('utm_source=email')
  })
})

describe('the viewport in the link', () => {
  it('round-trips, at the precision a map view needs', () => {
    atUrl('')
    writeViewParam({ center: { lat: 39.048366, lng: -120.17684 }, zoom: 7.599008 })

    expect(window.location.search).toBe('?at=39.0484%2C-120.1768%2C7.60')
    expect(readViewParam(window.location.search)).toEqual({
      center: { lat: 39.0484, lng: -120.1768 },
      zoom: 7.6,
    })
  })

  it('is absent until the reader moves the map', () => {
    expect(readViewParam('?zone=Olympics')).toBeNull()
  })

  // A hand-edited link must not fly the map off the globe, or crash it.
  it('refuses a malformed or impossible viewport', () => {
    expect(readViewParam('?at=47,-121')).toBeNull()
    expect(readViewParam('?at=here,there,everywhere')).toBeNull()
    expect(readViewParam('?at=947,-121,8')).toBeNull()
    expect(readViewParam('?at=47,-1210,8')).toBeNull()
  })

  it('hands the framing back to the map when dropped', () => {
    atUrl('?at=47.0000,-121.0000,8.00&zone=Olympics')
    dropViewParam()

    expect(readViewParam(window.location.search)).toBeNull()
    expect(window.location.search).toContain('zone=Olympics')
  })
})

describe('map or table in the link', () => {
  it('shows the map unless the link asks for the table', () => {
    expect(readDisplayRequest('', '')).toEqual({ display: 'map', highlight: null, legacy: false })
    expect(readDisplayRequest('?view=table&zone=Olympics', '')).toEqual({
      display: 'table',
      highlight: null,
      legacy: false,
    })
    expect(readDisplayRequest('?view=chart', '').display).toBe('map')
  })

  it("opens the table for the widget's own table links, picking out the station one names", () => {
    expect(readDisplayRequest('', '#/station-table')).toEqual({
      display: 'table',
      highlight: null,
      legacy: true,
    })
    expect(readDisplayRequest('', '#/station-table/C6318')).toEqual({
      display: 'table',
      highlight: 'C6318',
      legacy: true,
    })
    expect(readDisplayRequest('', '#/station-table/57?units=metric').highlight).toBe('57')
    expect(readDisplayRequest('', '#/station-table/%E0%A4%A').highlight).toBe('%E0%A4%A')
  })

  it("leaves the widget's map links, and any other hash, to the map", () => {
    expect(readDisplayRequest('', '#/57').display).toBe('map')
    expect(readDisplayRequest('', '#main-content').display).toBe('map')
  })

  it('writes the table and drops it again for the map, keeping the other params', () => {
    atUrl('?zone=Olympics')
    writeDisplayParam('table')
    expect(window.location.search).toBe('?zone=Olympics&view=table')

    writeDisplayParam('map')
    expect(window.location.search).toBe('?zone=Olympics')
  })

  it('replaces a legacy hash with the param', () => {
    window.history.replaceState(null, '', '/weather/stations/map#/station-table/57')
    writeDisplayParam('table')
    expect(window.location.hash).toBe('')
    expect(window.location.search).toBe('?view=table')
  })
})

describe("the widget's links", () => {
  it('carry their zone filter inside the hash, as JSON', () => {
    expect(
      readLegacyHashZones('#/station-table?zone=%5B%22Olympics%22%2C%22Mt%20Hood%22%5D'),
    ).toEqual(['Olympics', 'Mt Hood'])
    expect(readLegacyHashZones('#/?zone=["Carson Range"]')).toEqual(['Carson Range'])
  })

  it('yield no zones for a missing, malformed or non-list query', () => {
    expect(readLegacyHashZones('#/station-table')).toEqual([])
    expect(readLegacyHashZones('#/station-table?zone=Olympics')).toEqual([])
    expect(readLegacyHashZones('#/station-table?zone={"a":1}')).toEqual([])
    expect(readLegacyHashZones('#main-content')).toEqual([])
  })
})

describe('switching between the map and the table', () => {
  it('is a history entry of its own, so Back returns to the map', () => {
    atUrl('?zone=Olympics')
    const before = window.history.length
    pushDisplayParam('table')

    expect(window.history.length).toBe(before + 1)
    expect(window.location.search).toBe('?zone=Olympics&view=table')
  })
})
