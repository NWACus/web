import { areaBounds, keepInsideArea, type GeoArea } from '@/utilities/geo/area'
import type { LatLng } from '@/utilities/geo/distance'
import { andWhere, withinBoxWhere } from '@/utilities/geo/where'
import type { Where } from 'payload'

// GeoJSON rings are [longitude, latitude] pairs, first point repeated last.
const ring = (...points: Array<[number, number]>) => [...points, points[0]]

// A "C" opening east: the notch between the arms is inside the bounding box but outside the area.
const cShape: GeoArea = {
  type: 'Polygon',
  coordinates: [
    ring(
      [-122, 47],
      [-121, 47],
      [-121, 47.2],
      [-121.8, 47.2],
      [-121.8, 47.8],
      [-121, 47.8],
      [-121, 48],
      [-122, 48],
    ),
  ],
}

const docs = (points: Record<string, LatLng | null>) =>
  Object.entries(points).map(([id, coordinates]) => ({ id, coordinates }))

const insideIds = (area: GeoArea, points: Record<string, LatLng | null>) =>
  keepInsideArea(docs(points), area, (doc) => doc.coordinates).map((doc) => doc.id)

describe('areaBounds', () => {
  it('is the box around every vertex', () => {
    expect(areaBounds(cShape)).toEqual({ south: 47, north: 48, west: -122, east: -121 })
  })
})

describe('keepInsideArea', () => {
  it('keeps points inside a concave area and drops ones in its notch', () => {
    expect(
      insideIds(cShape, {
        spine: { latitude: 47.5, longitude: -121.9 },
        lowerArm: { latitude: 47.1, longitude: -121.2 },
        notch: { latitude: 47.5, longitude: -121.2 },
        outside: { latitude: 46.5, longitude: -121.5 },
      }),
    ).toEqual(['spine', 'lowerArm'])
  })

  it('counts a point on the edge as inside, and drops docs without coordinates', () => {
    expect(
      insideIds(cShape, {
        edge: { latitude: 47, longitude: -121.5 },
        missing: null,
      }),
    ).toEqual(['edge'])
  })

  it('excludes holes and accepts multi-part areas', () => {
    const withHole: GeoArea = {
      type: 'MultiPolygon',
      coordinates: [
        [
          ring([-122, 47], [-121, 47], [-121, 48], [-122, 48]),
          ring([-121.6, 47.4], [-121.4, 47.4], [-121.4, 47.6], [-121.6, 47.6]),
        ],
        [ring([-117, 43], [-116, 43], [-116, 44], [-117, 44])],
      ],
    }
    expect(
      insideIds(withHole, {
        ring: { latitude: 47.2, longitude: -121.8 },
        hole: { latitude: 47.5, longitude: -121.5 },
        secondPart: { latitude: 43.5, longitude: -116.5 },
        between: { latitude: 45, longitude: -119 },
      }),
    ).toEqual(['ring', 'secondPart'])
  })
})

describe('withinBoxWhere', () => {
  const box = { south: 47, north: 48, west: -122, east: -121 }
  const boxWhere: Where = {
    and: [
      { 'location.coordinates.latitude': { greater_than_equal: 47, less_than_equal: 48 } },
      { 'location.coordinates.longitude': { greater_than_equal: -122, less_than_equal: -121 } },
    ],
  }

  it('ranges both coordinate columns under the given path', () => {
    expect(withinBoxWhere('location.coordinates', box)).toEqual(boxWhere)
  })

  it('combines with a caller’s where', () => {
    const tenant = { tenant: { equals: 1 } }
    expect(andWhere(tenant, boxWhere)).toEqual({ and: [tenant, boxWhere] })
    expect(andWhere(undefined, boxWhere)).toBe(boxWhere)
  })
})
