import type { ZoneGeometry, ZoneMapLayer, ZoneProperties } from '@/services/nac/model/mapLayer'
import {
  OTHER_ZONE,
  alternateZoneNames,
  classifyZone,
  mapStations,
  mapWebcams,
  orderZoneNames,
  stationHref,
  stationPageLookup,
  zonesFromMapLayer,
} from '@/services/snowobs/stationMap/mappers'
import type { StationMapZone } from '@/services/snowobs/stationMap/model'
import {
  snowObsCurrentGeojsonSchema,
  snowObsWebcamResponseSchema,
} from '@/services/snowobs/types/schemas'
import fixture from './fixtures/snowobsCurrent.json'

/** A box around White Chuck (48.22, -121.44) and nothing else in the fixture. */
const northGeometry: ZoneGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-122, 48],
      [-121, 48],
      [-121, 49],
      [-122, 49],
      [-122, 48],
    ],
  ],
}
const northZone: StationMapZone = { name: 'West Slopes North', geometry: northGeometry }

const current = snowObsCurrentGeojsonSchema.parse(fixture)

describe('the current-data schema', () => {
  it('parses a real response and coerces the station id to a string', () => {
    expect(current.features.map((f) => f.properties.stid)).toEqual(['57', '502', 'C6318', '999'])
    expect(current.properties.units.air_temp).toBe('fahrenheit')
  })
})

const nwac = (stid: string) => ({ stid, source: 'nwac' })

// nwac:502 is a different station from the fixture's snotel:502.
const stationPages = stationPageLookup([
  { slug: 'white-chuck', archived: false, stations: [nwac('57')] },
  { slug: 'not-the-snotel-station', archived: false, stations: [nwac('502')] },
])

describe('mapStations', () => {
  const options = { stationPages, zones: [northZone] }
  const stations = mapStations(current, options)

  it('drops a station with no coordinates', () => {
    expect(stations.map((s) => s.stid)).toEqual(['57', '502', 'C6318'])
  })

  it('separates the reading time from the readings', () => {
    const whiteChuck = stations[0]
    expect(whiteChuck.observedAt).toBe('2026-09-04T04:00:00Z')
    expect(whiteChuck.data.date_time).toBeUndefined()
    expect(whiteChuck.data.air_temp).toBe(40)
  })

  it('classifies each station into its zone, or Other', () => {
    expect(stations.map((s) => s.zone)).toEqual(['West Slopes North', OTHER_ZONE, OTHER_ZONE])
  })

  it('renames mesowest to synoptic-data', () => {
    expect(stations[2].source).toBe('synoptic-data')
  })

  it('links a station to the page that shows it, matched on source and stid', () => {
    expect(stations[0].href).toBe('/weather/stations/white-chuck')
    expect(stations[1].href).toBe('/weather/stations/station/snotel/502')
  })

  it("links a mesowest station's detail page on the raw source, not the display name", () => {
    expect(stations[2].href).toBe('/weather/stations/station/mesowest/C6318')
  })

  it('links every station to its detail page for a center without native station pages', () => {
    const other = mapStations(current, { ...options, stationPages: new Map() })
    expect(other.map((s) => s.href)).toEqual([
      '/weather/stations/station/nwac/57',
      '/weather/stations/station/snotel/502',
      '/weather/stations/station/mesowest/C6318',
    ])
  })
})

describe('stationPageLookup', () => {
  it('links every station of a multi-station page to that page', () => {
    const pages = stationPageLookup([
      { slug: 'alpental', archived: false, stations: [nwac('1'), nwac('2')] },
    ])
    expect(stationHref(pages, nwac('2'))).toBe('/weather/stations/alpental')
  })

  it('prefers a live page over an archived one that lists the same station', () => {
    const pages = stationPageLookup([
      { slug: 'old-site', archived: true, stations: [nwac('1')] },
      { slug: 'new-site', archived: false, stations: [nwac('1')] },
    ])
    expect(stationHref(pages, nwac('1'))).toBe('/weather/stations/new-site')
  })

  it('still links to an archived page when that is the only one', () => {
    const pages = stationPageLookup([{ slug: 'old-site', archived: true, stations: [nwac('1')] }])
    expect(stationHref(pages, nwac('1'))).toBe('/weather/stations/old-site')
  })

  it("falls back to the station's detail page when no page shows it", () => {
    expect(stationHref(stationPages, nwac('999'))).toBe('/weather/stations/station/nwac/999')
  })

  it('escapes a stid that is not URL-safe', () => {
    expect(stationHref(new Map(), { source: 'mesowest', stid: 'A B/1' })).toBe(
      '/weather/stations/station/mesowest/A%20B%2F1',
    )
  })
})

describe('mapWebcams', () => {
  it('normalizes the webcam list and drops images with no source', () => {
    const response = snowObsWebcamResponseSchema.parse({
      webcam: [
        {
          id: 48,
          webcam_title: 'Dirtyface',
          location: { geometry: { type: 'Point', coordinates: [-121.5, 48.5] } },
          webcam_image: [
            {
              id: 66,
              image_title: 'Dirtyface',
              image_type: 'image',
              image_source: 'https://x/a.jpg',
            },
            { id: 67, image_title: 'Broken', image_type: 'image', image_source: null },
          ],
        },
        { id: 49, webcam_title: 'Nowhere', location: null, webcam_image: [] },
      ],
    })

    const webcams = mapWebcams(response, [northZone])
    expect(webcams).toEqual([
      {
        id: 48,
        title: 'Dirtyface',
        coordinates: [-121.5, 48.5],
        images: [{ id: 66, title: 'Dirtyface', type: 'image', source: 'https://x/a.jpg' }],
        zone: 'West Slopes North',
      },
    ])
  })
})

/** Only the name matters to the station map; the danger fields are filled to satisfy the type. */
function zoneProperties(name: string): ZoneProperties {
  return {
    name,
    center: null,
    center_link: null,
    timezone: null,
    center_id: 'NWAC',
    state: null,
    off_season: false,
    travel_advice: null,
    danger: null,
    danger_level: -1,
    color: null,
    stroke: null,
    font_color: null,
    link: null,
    start_date: null,
    end_date: null,
    warning: { product: null },
  }
}

describe('zones', () => {
  const mapLayer: ZoneMapLayer = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 1,
        geometry: northGeometry,
        properties: zoneProperties('West Slopes North'),
      },
      { type: 'Feature', id: 2, geometry: null, properties: zoneProperties('Broken') },
    ],
  }

  it('keeps only zones with drawable geometry', () => {
    expect(zonesFromMapLayer(mapLayer).map((zone) => zone.name)).toEqual(['West Slopes North'])
  })

  it("orders zone names the center's way, appending any the center does not list", () => {
    const zones = [northZone, { ...northZone, name: 'Extra' }, { ...northZone, name: 'Olympics' }]
    expect(orderZoneNames(['Olympics', 'West Slopes North', 'Unknown'], zones)).toEqual([
      'Olympics',
      'West Slopes North',
      'Extra',
    ])
  })

  it('classifies a point outside every zone as Other', () => {
    expect(classifyZone([0, 0], [northZone])).toBe(OTHER_ZONE)
  })

  it("lists alternate zones in file order with Other last, as the widget's zoneNames does", () => {
    const zones = [northZone, { ...northZone, name: 'Carson Range' }, northZone]
    expect(alternateZoneNames(zones)).toEqual(['West Slopes North', 'Carson Range', OTHER_ZONE])
  })
})
