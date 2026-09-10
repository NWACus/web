import { boundsOfGeometries } from '@/utilities/geo/bounds'
import { pointInPolygon, type PolygonGeometry } from '@/utilities/geo/pointInPolygon'

const square: PolygonGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
  ],
}

const squareWithHole: PolygonGeometry = {
  type: 'Polygon',
  coordinates: [
    square.coordinates[0],
    [
      [4, 4],
      [6, 4],
      [6, 6],
      [4, 6],
      [4, 4],
    ],
  ],
}

const twoSquares: PolygonGeometry = {
  type: 'MultiPolygon',
  coordinates: [
    square.coordinates,
    [
      [
        [20, 20],
        [30, 20],
        [30, 30],
        [20, 30],
        [20, 20],
      ],
    ],
  ],
}

describe('pointInPolygon', () => {
  it('finds a point inside a polygon', () => {
    expect(pointInPolygon([5, 5], square)).toBe(true)
  })

  it('rejects a point outside a polygon', () => {
    expect(pointInPolygon([15, 5], square)).toBe(false)
    expect(pointInPolygon([-1, -1], square)).toBe(false)
  })

  it('treats a point inside a hole as outside', () => {
    expect(pointInPolygon([5, 5], squareWithHole)).toBe(false)
    expect(pointInPolygon([2, 2], squareWithHole)).toBe(true)
  })

  it('checks every part of a MultiPolygon', () => {
    expect(pointInPolygon([25, 25], twoSquares)).toBe(true)
    expect(pointInPolygon([5, 5], twoSquares)).toBe(true)
    expect(pointInPolygon([15, 15], twoSquares)).toBe(false)
  })

  it('ignores a third elevation value on a position', () => {
    expect(pointInPolygon([5, 5, 1200], square)).toBe(true)
  })

  it('handles a concave polygon', () => {
    const lShape: PolygonGeometry = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 4],
          [4, 4],
          [4, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    }
    expect(pointInPolygon([2, 8], lShape)).toBe(true)
    expect(pointInPolygon([8, 8], lShape)).toBe(false)
  })
})

describe('boundsOfGeometries', () => {
  it('frames every polygon', () => {
    expect(boundsOfGeometries([twoSquares])).toEqual([
      [0, 0],
      [30, 30],
    ])
  })

  it('returns null with nothing to frame', () => {
    expect(boundsOfGeometries([])).toBeNull()
  })
})
