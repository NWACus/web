import { parseKmlZones } from '@/services/snowobs/stationMap/kml'
import { pointInPolygon } from '@/utilities/geo/pointInPolygon'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures/kml', name), 'utf8')

describe('parseKmlZones', () => {
  it("reads SAC's Google Earth export: one polygon per placemark, in file order", () => {
    const zones = parseKmlZones(fixture('sac-weather-station-zones.kml'))

    expect(zones.map((zone) => zone.name)).toEqual([
      'Sierra Crest North',
      'Sierra Crest South',
      'Carson Range',
    ])
    expect(zones.every((zone) => zone.geometry.type === 'Polygon')).toBe(true)
    // Donner Summit sits in the northern crest polygon; Reno does not sit in any of them.
    expect(pointInPolygon([-120.32, 39.32], zones[0].geometry)).toBe(true)
    expect(zones.some((zone) => pointInPolygon([-119.81, 39.53], zone.geometry))).toBe(false)
  })

  it("reads BTAC's MultiGeometry placemarks and keeps every polygon", () => {
    const zones = parseKmlZones(fixture('btac-alternate-zones.kml'))

    expect(zones.length).toBe(10)
    expect(zones.map((zone) => zone.name)).toContain('Tetons')
    // The Document and Folder are named too; they are not zones.
    expect(zones.map((zone) => zone.name)).not.toContain('BTAC_AlternateZones')
    // Jackson Hole's ridge is in the Tetons polygon.
    const tetons = zones.find((zone) => zone.name === 'Tetons')
    expect(tetons && pointInPolygon([-110.85, 43.6], tetons.geometry)).toBe(true)
  })

  it('decodes entities, trims names, honors holes and skips placemarks without a polygon', () => {
    const kml = `<?xml version="1.0"?>
<kml><Document><name>Doc</name>
  <Placemark><name>Galena &amp; Eastern </name>
    <Polygon><outerBoundaryIs><LinearRing><coordinates>
      0,0,0 10,0,0 10,10,0 0,10,0 0,0,0
    </coordinates></LinearRing></outerBoundaryIs>
    <innerBoundaryIs><LinearRing><coordinates>4,4 6,4 6,6 4,6 4,4</coordinates></LinearRing></innerBoundaryIs>
    </Polygon>
  </Placemark>
  <Placemark><name>A station</name><Point><coordinates>1,1,0</coordinates></Point></Placemark>
  <Placemark><name>Two parts</name><MultiGeometry>
    <Polygon><outerBoundaryIs><LinearRing><coordinates>20,20 30,20 30,30 20,30 20,20</coordinates></LinearRing></outerBoundaryIs></Polygon>
    <Polygon><outerBoundaryIs><LinearRing><coordinates>40,40 50,40 50,50 40,50 40,40</coordinates></LinearRing></outerBoundaryIs></Polygon>
  </MultiGeometry></Placemark>
  <Placemark><name>Degenerate</name><Polygon><outerBoundaryIs><LinearRing><coordinates>0,0 1,1</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
</Document></kml>`

    const zones = parseKmlZones(kml)
    expect(zones.map((zone) => zone.name)).toEqual(['Galena & Eastern', 'Two parts'])

    const [withHole, twoParts] = zones
    expect(pointInPolygon([2, 2], withHole.geometry)).toBe(true)
    expect(pointInPolygon([5, 5], withHole.geometry)).toBe(false)
    expect(twoParts.geometry.type).toBe('MultiPolygon')
    expect(pointInPolygon([45, 45], twoParts.geometry)).toBe(true)
  })

  it('returns nothing for a file with no polygons', () => {
    expect(parseKmlZones('<kml><Document><name>Empty</name></Document></kml>')).toEqual([])
    expect(parseKmlZones('not xml at all')).toEqual([])
  })
})
