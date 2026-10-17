jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import {
  listUrl,
  newestFirst,
  observationMedia,
  thumbnailOf,
  toAvalanches,
  toObservations,
  weekWindow,
} from '@/services/nac/zoneObservations'

const window = { from: '2026-02-24', to: '2026-03-02' }

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

const list = (results: unknown[]) => ({ total: results.length, pages: 1, results })

describe('listUrl', () => {
  it('asks for the zone’s week with the operator params, newest first', () => {
    const url = new URL(listUrl('observation', 'SNFAC', 2904, window))

    expect(url.pathname).toBe('/obs/v1/public/observation/list/')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      'center_id[eq]': 'snfac',
      'zone_id[in]': '2904',
      'start_date[gte]': '2026-02-24',
      'start_date[lte]': '2026-03-02',
      page_size: '100',
      sort_by: 'start_date',
      sort_order: 'DESC',
    })
  })

  it('filters avalanches by their date field', () => {
    const url = new URL(listUrl('avalanche_observation', 'SNFAC', 2904, window))

    expect(url.pathname).toBe('/obs/v1/public/avalanche_observation/list/')
    expect(url.searchParams.get('date[gte]')).toBe('2026-02-24')
    expect(url.searchParams.get('date[lte]')).toBe('2026-03-02')
    expect(url.searchParams.get('sort_by')).toBe('date')
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

describe('toObservations', () => {
  it('maps the fields the cards read, newest first', () => {
    const result = toObservations(
      list([
        observation({ id: 'older', start_date: '2026-02-28' }),
        observation({
          media: [{ type: 'image', url: { thumbnail: 'a.jpg' } }],
          avalanches: [{ media: [{ type: 'image', url: { thumbnail: 'b.jpg' } }] }],
        }),
      ]),
    )

    expect(result).toEqual([
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
      expect.objectContaining({ id: 'older', date: '2026-02-28' }),
    ])
  })

  it('rejects a response without a results list', () => {
    expect(() => toObservations({ detail: 'Unauthorized' })).toThrow()
  })
})

describe('toAvalanches', () => {
  it('maps the fields the cards read, newest first', () => {
    const result = toAvalanches(
      list([avalanche(), avalanche({ id: 'avy-2', date: '2026-02-26', d_size: null })]),
    )

    expect(result.map((a) => a.id)).toEqual(['avy-2', 'avy-1'])
    expect(result[1]).toEqual({
      id: 'avy-1',
      date: '2026-02-25',
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
