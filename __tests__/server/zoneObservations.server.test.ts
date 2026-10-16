jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import type { ZoneGeometry } from '@/services/nac/model/mapLayer'
import {
  inZone,
  isInZone,
  newestFirst,
  observationMedia,
  thumbnailOf,
  toCenterWeek,
  weekWindow,
} from '@/services/nac/zoneObservations'

// A 1°×1° square from (0,0) to (1,1), with a hole from (0.4,0.4) to (0.6,0.6).
const square: ZoneGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
    [
      [0.4, 0.4],
      [0.6, 0.4],
      [0.6, 0.6],
      [0.4, 0.6],
      [0.4, 0.4],
    ],
  ],
}

const window = { from: '2026-02-24', to: '2026-03-02' }

function observation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'obs-1',
    startDate: '2026-03-01',
    locationName: 'Butterfield',
    locationPoint: { lat: 0.2, lng: 0.2 },
    observerType: 'forecaster',
    organization: '',
    instability: { cracking: false, collapsing: true, avalanches_observed: false },
    media: [],
    avalanches: [],
    ...overrides,
  }
}

function avalanche(overrides: Record<string, unknown> = {}) {
  return {
    id: 'avy-1',
    date: '2026-02-25',
    locationName: 'Goat Peak',
    locationPoint: { lat: 0.8, lng: 0.8 },
    number: 1,
    aspect: 'SE',
    elevation: 10300,
    dSize: '2.5',
    trigger: 'N',
    media: [],
    ...overrides,
  }
}

function body(observations: unknown[], avalanches: unknown[]) {
  return { data: { getObservationList: observations, getAvalancheObservationList: avalanches } }
}

describe('isInZone', () => {
  it('keeps points inside the outline and drops points in a hole or outside', () => {
    expect(isInZone({ lat: 0.2, lng: 0.2 }, square)).toBe(true)
    expect(isInZone({ lat: 0.5, lng: 0.5 }, square)).toBe(false)
    expect(isInZone({ lat: 1.5, lng: 0.5 }, square)).toBe(false)
  })

  it('drops records without a point', () => {
    expect(isInZone(null, square)).toBe(false)
    expect(isInZone({ lat: null, lng: null }, square)).toBe(false)
  })

  it('checks every polygon of a MultiPolygon', () => {
    const multi: ZoneGeometry = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
        [
          [
            [5, 5],
            [6, 5],
            [6, 6],
            [5, 5],
          ],
        ],
      ],
    }
    expect(isInZone({ lat: 5.2, lng: 5.8 }, multi)).toBe(true)
    expect(isInZone({ lat: 3, lng: 3 }, multi)).toBe(false)
  })
})

describe('newestFirst', () => {
  it('sorts by date and keeps the API order within a day, as the widget does', () => {
    const items = [
      { id: 'a', date: '2026-02-25' },
      { id: 'b', date: '2026-02-26' },
      { id: 'c', date: '2026-02-25' },
      { id: 'd', date: '2026-02-25' },
    ]
    expect(newestFirst(items).map((i) => i.id)).toEqual(['b', 'a', 'c', 'd'])
  })
})

describe('observationMedia', () => {
  const photo = { type: 'image', url: { thumbnail: 'a.jpg' } }

  it('adds the avalanches’ media after the observation’s own', () => {
    expect(observationMedia([photo], [{ media: [photo, photo] }])).toHaveLength(3)
  })

  it('shows none when the observation has no media of its own, as the widget does', () => {
    expect(observationMedia([], [{ media: [photo] }])).toEqual([])
  })
})

describe('thumbnailOf', () => {
  it('prefers the first image over earlier attachments', () => {
    expect(
      thumbnailOf([
        { type: 'pdf', url: { thumbnail: undefined } },
        { type: 'image', url: { thumbnail: 'thumb.jpg', medium: 'medium.jpg' } },
      ]),
    ).toEqual({ kind: 'image', src: 'thumb.jpg' })
  })

  it('takes the first item when there is no image, drawn by its type', () => {
    expect(thumbnailOf([{ type: 'photo', url: 'p.jpg' }, { type: 'pdf' }])).toEqual({
      kind: 'image',
      src: 'p.jpg',
    })
    expect(thumbnailOf([{ type: 'video', url: { thumbnail: 'v.jpg' } }])).toEqual({
      kind: 'video',
      src: 'v.jpg',
    })
    expect(thumbnailOf([{ type: 'instagram' }])).toEqual({ kind: 'unknown' })
  })

  it('accepts the older photo shape with a string url', () => {
    expect(thumbnailOf([{ type: 'photo', url: 'photo.jpg' }])).toEqual({
      kind: 'image',
      src: 'photo.jpg',
    })
  })

  it('shows a tile for the first item when there is no image', () => {
    expect(thumbnailOf([{ type: 'pdf' }])).toEqual({ kind: 'pdf' })
    expect(thumbnailOf([{ type: 'external' }])).toEqual({ kind: 'external' })
    expect(thumbnailOf([])).toBeNull()
  })
})

describe('toZoneObservations', () => {
  it('keeps the zone’s records and maps the fields the cards read', () => {
    const result = inZone(
      toCenterWeek(
        body(
          [
            observation({
              media: [{ type: 'image', url: { thumbnail: 'a.jpg' } }],
              avalanches: [{ media: [{ type: 'image', url: { thumbnail: 'b.jpg' } }] }],
            }),
            observation({ id: 'outside', locationPoint: { lat: 3, lng: 3 } }),
          ],
          [avalanche(), avalanche({ id: 'in-hole', locationPoint: { lat: 0.5, lng: 0.5 } })],
        ),
      ),
      square,
      window,
    )

    expect(result.window).toEqual(window)
    expect(result.observations).toEqual([
      {
        id: 'obs-1',
        date: '2026-03-01',
        location: 'Butterfield',
        observerType: 'forecaster',
        organization: null,
        avalanchesObserved: false,
        instability: true,
        thumbnail: { kind: 'image', src: 'a.jpg' },
        mediaCount: 2,
      },
    ])
    expect(result.avalanches.map((a) => a.id)).toEqual(['avy-1'])
    expect(result.avalanches[0]).toMatchObject({ dSize: '2.5', trigger: 'N', mediaCount: 0 })
  })

  it('rejects a response without the two lists', () => {
    expect(() => toCenterWeek({ data: null })).toThrow()
  })
})

describe('weekWindow', () => {
  it('stays seven calendar days across a daylight-saving change', () => {
    // 00:30 PDT on Mar 10, the first night after the spring-forward.
    expect(weekWindow(new Date('2026-03-10T07:30:00Z'), 'America/Los_Angeles')).toEqual({
      from: '2026-03-04',
      to: '2026-03-10',
    })
  })

  it('is today and the six days before it in the center’s timezone', () => {
    // 05:00 UTC on Mar 2 is still Mar 1 in Boise.
    expect(weekWindow(new Date('2026-03-02T05:00:00Z'), 'America/Boise')).toEqual({
      from: '2026-02-23',
      to: '2026-03-01',
    })
  })
})
