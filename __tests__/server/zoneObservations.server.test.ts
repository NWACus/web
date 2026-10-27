jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { listParams } from '@/services/nac/observations/listParams'
import { mapAvalanche, mapObservation, mapPage } from '@/services/nac/sources/v2/observationMappers'
import { mediaItemSchema } from '@/services/nac/types/forecastSchemas'
import { avalancheListSchema, observationListSchema } from '@/services/nac/types/observationSchemas'
import {
  newestFirst,
  thumbnailOf,
  toZoneAvalanche,
  toZoneObservation,
  weekWindow,
  zoneListRequest,
} from '@/services/nac/zoneObservations'

const window = { from: '2026-02-24', to: '2026-03-02' }

const image = (thumbnail: string) => ({
  type: 'image',
  url: { thumbnail, medium: 'm.jpg', large: 'l.jpg', original: 'o.jpg' },
  caption: null,
})

function observation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'obs-1',
    start_date: '2026-03-01',
    created_at: '2026-03-01T20:00:00.000000Z',
    zone_id: '2904',
    location_name: 'Butterfield',
    location_point: { lat: null, lng: null },
    observer_type: 'forecaster',
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
    created_at: '2026-02-26T05:41:23.706864Z',
    zone_id: '2904',
    location_name: 'Goat Peak',
    number: 1,
    aspect: 'SE',
    elevation: 10300,
    d_size: '2.5',
    trigger: 'N',
    media: [],
    ...overrides,
  }
}

const list = (results: unknown[]) => ({ total: results.length, pages: 1, current_page: 1, results })

/** A list response through the viewer's schema and mapper, as the source reads it. */
const observations = (results: unknown[]) =>
  mapPage(observationListSchema.parse(list(results)), mapObservation).items
const avalanches = (results: unknown[]) =>
  mapPage(avalancheListSchema.parse(list(results)), mapAvalanche).items

describe('zoneListRequest', () => {
  it('asks for this center’s records in the zone’s week, newest first', () => {
    const params = listParams(zoneListRequest('observation', 2904, window), 'snfac')

    expect(Object.fromEntries(params)).toEqual({
      'center_id[eq]': 'snfac',
      'zone_id[in]': '2904',
      'start_date[gte]': '2026-02-24',
      'start_date[lte]': '2026-03-02',
      page: '1',
      page_size: '100',
      sort_by: 'start_date',
      sort_order: 'desc',
    })
  })

  it('filters avalanches by their date field, and by nothing else', () => {
    const params = listParams(zoneListRequest('avalanche', 2904, window), 'snfac')

    expect(Object.fromEntries(params)).toEqual({
      'center_id[eq]': 'snfac',
      'zone_id[in]': '2904',
      'date[gte]': '2026-02-24',
      'date[lte]': '2026-03-02',
      page: '1',
      page_size: '100',
      sort_by: 'date',
      sort_order: 'desc',
    })
  })
})

describe('newestFirst', () => {
  it('sorts by date, then newest submitted, then id', () => {
    const items = [
      { id: 'a', date: '2026-02-25', createdAt: '2026-02-26T01:00:00.5Z' },
      { id: 'b', date: '2026-02-26', createdAt: '2026-02-26T00:00:00Z' },
      { id: 'c', date: '2026-02-25', createdAt: '2026-02-26T01:00:00.271936Z' },
      { id: 'e', date: '2026-02-25', createdAt: null },
      { id: 'd', date: '2026-02-25', createdAt: null },
    ]
    expect(newestFirst(items).map((i) => i.id)).toEqual(['b', 'a', 'c', 'd', 'e'])
  })
})

describe('thumbnailOf', () => {
  const item = (raw: unknown) => mediaItemSchema.parse(raw)

  it('draws an image or photo as its thumbnail', () => {
    expect(thumbnailOf(item(image('thumb.jpg')))).toEqual({ kind: 'image', src: 'thumb.jpg' })
    expect(thumbnailOf(item({ type: 'photo', url: 'p.jpg', caption: null }))).toEqual({
      kind: 'image',
      src: 'p.jpg',
    })
  })

  it('draws a video by its poster, and a PDF or link as a tile', () => {
    expect(thumbnailOf(item({ type: 'video', url: 'dQw4w9WgXcQ', caption: null }))).toEqual({
      kind: 'video',
      src: expect.stringContaining('dQw4w9WgXcQ'),
    })
    expect(
      thumbnailOf(item({ type: 'pdf', url: { original: 'https://x/a.pdf' }, caption: null })),
    ).toEqual({ kind: 'pdf' })
    expect(thumbnailOf(item({ type: 'instagram' }))).toEqual({ kind: 'unknown' })
    expect(thumbnailOf(null)).toBeNull()
  })
})

describe('toZoneObservation', () => {
  it('maps the fields the cards read', () => {
    const [result] = observations([
      observation({
        media: [
          { type: 'pdf', url: { original: 'https://x/a.pdf' }, caption: null },
          image('a.jpg'),
        ],
        avalanches: [avalanche({ media: [image('b.jpg')] })],
      }),
    ]).map(toZoneObservation)

    expect(result).toEqual({
      id: 'obs-1',
      date: '2026-03-01',
      createdAt: '2026-03-01T20:00:00.000000Z',
      location: 'Butterfield',
      observerType: 'forecaster',
      organization: null,
      avalanchesObserved: false,
      instability: true,
      // The first image, not the first item; the avalanche's media counts too.
      thumbnail: { kind: 'image', src: 'a.jpg' },
      mediaCount: 3,
    })
  })

  it('shows no media when the observation has none of its own, as the widget does', () => {
    const [result] = observations([
      observation({ avalanches: [avalanche({ media: [image('b.jpg')] })] }),
    ]).map(toZoneObservation)

    expect(result).toMatchObject({ thumbnail: null, mediaCount: 0 })
  })
})

describe('toZoneAvalanche', () => {
  it('maps the fields the cards read', () => {
    const [result] = avalanches([avalanche()]).map(toZoneAvalanche)

    expect(result).toEqual({
      id: 'avy-1',
      date: '2026-02-25',
      createdAt: '2026-02-26T05:41:23.706864Z',
      location: 'Goat Peak',
      number: 1,
      aspect: 'SE',
      elevation: 10300,
      dSize: '2.5',
      trigger: 'N',
      thumbnail: null,
      mediaCount: 0,
    })
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
