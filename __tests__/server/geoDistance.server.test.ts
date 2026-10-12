import { boundingBox, haversineKm, rankByDistance, type LatLng } from '@/utilities/geo/distance'
import { nearWhere } from '@/utilities/geo/findNear'

const KM_PER_DEGREE = 111.195
const seattle: LatLng = { latitude: 47.6062, longitude: -122.3321 }

// Point `distanceKm` from `start` along `bearingDegrees` on a sphere.
function destination(start: LatLng, bearingDegrees: number, distanceKm: number): LatLng {
  const R = 6371.0088
  const d = distanceKm / R
  const bearing = (bearingDegrees * Math.PI) / 180
  const lat1 = (start.latitude * Math.PI) / 180
  const lng1 = (start.longitude * Math.PI) / 180
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing),
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    )
  return { latitude: (lat2 * 180) / Math.PI, longitude: (lng2 * 180) / Math.PI }
}

describe('haversineKm', () => {
  it('measures one degree of latitude', () => {
    expect(haversineKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeCloseTo(
      KM_PER_DEGREE,
      2,
    )
  })

  it('shrinks a degree of longitude with latitude', () => {
    const atSixty = haversineKm({ latitude: 60, longitude: 0 }, { latitude: 60, longitude: 1 })
    expect(atSixty).toBeCloseTo(KM_PER_DEGREE / 2, 0)
  })

  it('is zero for the same point', () => {
    expect(haversineKm(seattle, seattle)).toBe(0)
  })
})

describe('boundingBox', () => {
  it('contains every point on the circle', () => {
    const box = boundingBox(seattle, 150)
    for (let bearing = 0; bearing < 360; bearing += 5) {
      const { latitude, longitude } = destination(seattle, bearing, 150)
      expect(latitude).toBeGreaterThanOrEqual(box.south - 1e-9)
      expect(latitude).toBeLessThanOrEqual(box.north + 1e-9)
      expect(longitude).toBeGreaterThanOrEqual(box.west - 1e-9)
      expect(longitude).toBeLessThanOrEqual(box.east + 1e-9)
    }
  })

  it('is tight to the circle', () => {
    const box = boundingBox(seattle, 150)
    expect(box.north).toBeCloseTo(destination(seattle, 0, 150).latitude, 6)
    expect(box.south).toBeCloseTo(destination(seattle, 180, 150).latitude, 6)
    const widest = Math.max(
      ...Array.from({ length: 3600 }, (_, i) => destination(seattle, i / 10, 150).longitude),
    )
    expect(box.east).toBeCloseTo(widest, 3)
  })

  it('spans all longitudes when the circle covers a pole', () => {
    expect(boundingBox({ latitude: 89.5, longitude: 10 }, 100)).toEqual({
      south: expect.any(Number),
      north: 90,
      west: -180,
      east: 180,
    })
  })
})

describe('rankByDistance', () => {
  const docs = [
    { id: 'leavenworth', coords: { latitude: 47.5962, longitude: -120.6615 } },
    { id: 'issaquah', coords: { latitude: 47.5301, longitude: -122.0326 } },
    { id: 'jackson', coords: { latitude: 43.4799, longitude: -110.7624 } },
    { id: 'no-coords', coords: null },
    { id: 'half-coords', coords: { latitude: 47.6 } },
  ]

  it('keeps docs inside the radius, nearest first, and drops docs without coordinates', () => {
    const ranked = rankByDistance(docs, seattle, 200, (doc) => doc.coords)
    expect(ranked.map(({ doc }) => doc.id)).toEqual(['issaquah', 'leavenworth'])
    expect(ranked[0].distanceKm).toBeGreaterThan(20)
    expect(ranked[0].distanceKm).toBeLessThan(30)
  })

  it('excludes the bounding box corners that fall outside the circle', () => {
    const box = boundingBox(seattle, 100)
    const corner = { id: 'corner', coords: { latitude: box.north, longitude: box.east } }
    expect(rankByDistance([corner], seattle, 100, (doc) => doc.coords)).toEqual([])
  })
})

describe('nearWhere', () => {
  it('ranges both coordinate columns under the given path', () => {
    const box = boundingBox(seattle, 50)
    expect(nearWhere('location.coordinates', seattle, 50)).toEqual({
      and: [
        {
          'location.coordinates.latitude': {
            greater_than_equal: box.south,
            less_than_equal: box.north,
          },
        },
        {
          'location.coordinates.longitude': {
            greater_than_equal: box.west,
            less_than_equal: box.east,
          },
        },
      ],
    })
  })
})
