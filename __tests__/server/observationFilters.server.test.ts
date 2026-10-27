import {
  activeTags,
  defaultFilters,
  defaultRange,
  presetRange,
  readFilters,
  readListState,
  removeTag,
  seasonLabel,
  seasonOptions,
  seasonRange,
  selectedPreset,
  writeFilters,
  zoneIdsForNames,
  type ListState,
  type ObservationFilters,
} from '@/services/nac/observations/filters'
import {
  isStatsRange,
  listParams,
  statsAggregation,
  statsParams,
} from '@/services/nac/observations/listParams'
import { legacyHashTarget, readViewerPath } from '@/services/nac/observations/routes'

const TODAY = '2026-02-20'
const CONTEXT = { today: TODAY, centerId: 'NWAC' }
const ID = '636d5d8a-1840-41bc-846d-1e8b8f632c2c'

describe('dates and seasons', () => {
  it('opens on the last two weeks', () => {
    expect(defaultRange(TODAY)).toEqual({ from: '2026-02-06', to: TODAY })
  })

  it('opens on the season so far when it is younger than two weeks', () => {
    expect(defaultRange('2026-09-05')).toEqual({ from: '2026-09-01', to: '2026-09-05' })
    expect(presetRange('2026-09-05', 30)).toEqual({ from: '2026-09-01', to: '2026-09-05' })
  })

  it('opens a past season whole and the current one on the default', () => {
    expect(seasonRange(2025, TODAY)).toEqual({ from: '2024-09-01', to: '2025-08-31' })
    expect(seasonRange(2026, TODAY)).toEqual(defaultRange(TODAY))
  })

  it('labels seasons as the widget does, back to the center’s first', () => {
    expect(seasonLabel(2025, 2026)).toBe('2024-25 Season')
    expect(seasonOptions(TODAY, 2024).map((option) => option.label)).toEqual([
      'Current Season',
      '2024-25 Season',
      '2023-24 Season',
    ])
  })

  it('names the preset a range matches', () => {
    expect(selectedPreset(defaultRange(TODAY), TODAY)).toBe('Past 2 Weeks')
    expect(selectedPreset(presetRange(TODAY, 7), TODAY)).toBe('Past Week')
    expect(selectedPreset({ from: '2025-09-01', to: TODAY }, TODAY)).toBe('This Season')
    expect(selectedPreset({ from: '2026-01-01', to: '2026-01-31' }, TODAY)).toBeNull()
  })
})

describe('the URL', () => {
  it('leaves an untouched viewer’s URL clean', () => {
    expect(writeFilters('', defaultFilters(TODAY), readListState(''), CONTEXT)).toBe('')
  })

  it('reads the widget’s own encoding, so legacy links keep their filters', () => {
    const search =
      '?startDate=2026-01-01&endDate=2026-01-31&season=2026&zone=["3028","3029"]' +
      '&center="NWAC"&observer=["public"]&avalancheObs=true&trigger=["Human"]&size=[2,5]' +
      '&elevationMin=5000&impacts=["Humans Buried"]&sortBy=createdAt&sortOrder=asc'
    expect(readFilters(search, TODAY)).toMatchObject({
      from: '2026-01-01',
      to: '2026-01-31',
      zones: ['3028', '3029'],
      onlyCenter: true,
      observers: ['public'],
      avalanchesObserved: true,
      triggers: ['Human'],
      size: [2, 5],
      elevationMin: 5000,
      impacts: ['Humans Buried'],
    })
    expect(readListState(search)).toEqual({ sortBy: 'createdAt', sortOrder: 'asc', page: 1 })
  })

  it('reads a single bare value as a one-item list', () => {
    expect(readFilters('?zone=3028&aspect=N', TODAY)).toMatchObject({
      zones: ['3028'],
      aspects: ['N'],
    })
  })

  it('keeps the default span before an end date given alone', () => {
    expect(readFilters('?endDate=2026-01-20', TODAY)).toMatchObject({
      from: '2026-01-06',
      to: '2026-01-20',
    })
  })

  it('swaps the zone names older links carry for zone ids', () => {
    const zones = [
      { id: '3028', name: 'Olympics' },
      { id: '3029', name: 'Mt Hood' },
    ]
    expect(zoneIdsForNames(['Olympics', '3029', 'Gone'], zones)).toEqual(['3028', '3029', 'Gone'])
  })

  it('drops values no filter offers', () => {
    expect(
      readFilters('?trigger=["Human","Alien"]&size=[0,9]&observer=["bot"]', TODAY),
    ).toMatchObject({ triggers: ['Human'], size: [1, 5], observers: [] })
  })

  it('keeps a range within one season and no later than today', () => {
    expect(readFilters('?startDate=2025-06-01&endDate=2025-10-01', TODAY)).toMatchObject({
      from: '2025-09-01',
      to: '2025-10-01',
    })
    expect(readFilters('?startDate=2026-02-01&endDate=2026-05-01', TODAY)).toMatchObject({
      to: TODAY,
    })
    expect(readFilters('?startDate=2026-02-10&endDate=2026-02-01', TODAY)).toMatchObject(
      defaultRange(TODAY),
    )
  })

  it('round-trips every filter and the list state', () => {
    const filters: ObservationFilters = {
      from: '2025-12-01',
      to: '2026-01-15',
      zones: ['3028'],
      onlyCenter: true,
      observers: ['forecaster', 'public'],
      instability: true,
      avalanchesObserved: true,
      triggers: ['Natural', 'Explosive'],
      causes: ['Remote'],
      size: [1.5, 3],
      elevationMin: 0,
      elevationMax: 9000,
      aspects: ['N', 'NE'],
      problems: ['Wind Slab'],
      impacts: ['Vehicles Hit'],
    }
    const list: ListState = { sortBy: 'createdAt', sortOrder: 'asc', page: 3 }
    const search = writeFilters('?unrelated=1', filters, list, CONTEXT)
    expect(new URLSearchParams(search).get('unrelated')).toBe('1')
    expect(readFilters(search, TODAY)).toEqual(filters)
    expect(readListState(search)).toEqual(list)
  })
})

describe('removable tags', () => {
  it('lists only what a tab applies, dates only when changed', () => {
    const filters = { ...defaultFilters(TODAY), instability: true, aspects: ['N'] }
    expect(activeTags(filters, 'observation', TODAY)).toEqual([{ key: 'instability' }])
    expect(activeTags(filters, 'avalanche', TODAY)).toEqual([{ key: 'aspects', value: 'N' }])
  })

  it('shows no elevation tag while the bounds contradict each other', () => {
    const filters = { ...defaultFilters(TODAY), elevationMin: 9000, elevationMax: 1000 }
    expect(activeTags(filters, 'avalanche', TODAY)).toEqual([])
  })

  it('lifts one value and leaves the rest', () => {
    const filters = { ...defaultFilters(TODAY), zones: ['a', 'b'] }
    expect(removeTag(filters, { key: 'zones', value: 'a' }, TODAY).zones).toEqual(['b'])
    const dated = { ...defaultFilters(TODAY), from: '2026-01-01', to: '2026-01-02' }
    expect(removeTag(dated, { key: 'dates' }, TODAY)).toMatchObject(defaultRange(TODAY))
  })
})

describe('listParams', () => {
  const bbox: [number, number, number, number] = [-122.1, 46.9, -120.3, 48.2]
  const base = { filters: defaultFilters(TODAY), bbox, list: readListState('') }

  it('pages 25 at a time within the viewport, newest first by default', () => {
    const params = listParams({ ...base, kind: 'observation' }, 'nwac')
    expect(Object.fromEntries(params)).toEqual({
      'start_date[gte]': '2026-02-06',
      'start_date[lte]': TODAY,
      bbox: '-122.1,46.9,-120.3,48.2',
      page: '1',
      page_size: '25',
      sort_by: 'start_date',
      sort_order: 'desc',
    })
  })

  it('sorts avalanches by occurrence or submission', () => {
    const params = listParams(
      { ...base, kind: 'avalanche', list: { sortBy: 'createdAt', sortOrder: 'asc', page: 2 } },
      'nwac',
    )
    expect(params.get('sort_by')).toBe('created_at')
    expect(params.get('date[gte]')).toBe('2026-02-06')
  })

  it('sends size bounds only when narrowed, and elevation whenever set', () => {
    const narrowed: ObservationFilters = { ...base.filters, size: [1, 3], elevationMin: 0 }
    const params = listParams({ ...base, kind: 'avalanche', filters: narrowed }, 'nwac')
    expect(params.has('d_size[gte]')).toBe(false)
    expect(params.get('d_size[lte]')).toBe('3')
    expect(params.get('elevation[gte]')).toBe('0')
  })

  it('scopes to the center only when asked', () => {
    const only = { ...base.filters, onlyCenter: true }
    expect(
      listParams({ ...base, kind: 'observation', filters: only }, 'nwac').get('center_id[eq]'),
    ).toBe('nwac')
  })
})

describe('statsParams', () => {
  const bbox: [number, number, number, number] = [-122.1, 46.9, -120.3, 48.2]
  const base = { filters: defaultFilters(TODAY), bbox, zoom: 8 }

  it('asks for the avalanche filters over the viewport, by zone', () => {
    const params = statsParams(
      { ...base, filters: { ...base.filters, triggers: ['Human'] } },
      'nwac',
    )
    expect(Object.fromEntries(params)).toEqual({
      'date[gte]': '2026-02-06',
      'date[lte]': TODAY,
      bbox: '-122.1,46.9,-120.3,48.2',
      'trigger[in]': 'AS,AR,AM,AK,AV,AI,AF,AU,AO',
      aggregation_type: 'zone',
    })
    expect(params.has('page')).toBe(false)
  })

  it('groups by center when zoomed out past level 6 with no center filter', () => {
    expect(statsAggregation({ ...base, zoom: 5 })).toBe('center')
    expect(statsAggregation({ ...base, zoom: 6 })).toBe('zone')
    expect(statsAggregation({ ...base, zoom: null })).toBe('zone')
    const only = { ...base.filters, onlyCenter: true }
    expect(statsAggregation({ filters: only, zoom: 3 })).toBe('zone')
    expect(statsParams({ filters: only, bbox, zoom: 3 }, 'nwac').get('aggregation_type')).toBe(
      'zone',
    )
  })

  it('knows the endpoint’s 366-day limit, which a season never reaches', () => {
    expect(isStatsRange({ from: '2025-09-01', to: '2026-08-31' })).toBe(true)
    expect(isStatsRange({ from: '2025-09-01', to: '2026-09-02' })).toBe(true)
    expect(isStatsRange({ from: '2025-09-01', to: '2026-09-03' })).toBe(false)
    expect(isStatsRange({ from: '2026-03-01', to: '2026-02-01' })).toBe(false)
  })
})

describe('viewer addresses', () => {
  it.each([
    ['/observations', { prefix: '', tab: 'observation', detail: null }],
    ['/nwac/observations/avalanches', { prefix: '/nwac', tab: 'avalanche', detail: null }],
    [
      `/observations/${ID}`,
      { prefix: '', tab: 'observation', detail: { kind: 'observation', id: ID } },
    ],
    [
      `/nwac/observations/avalanches/${ID}`,
      { prefix: '/nwac', tab: 'avalanche', detail: { kind: 'avalanche', id: ID } },
    ],
  ])('%s', (path, expected) => {
    expect(readViewerPath(path)).toEqual(expected)
  })

  it('is not the viewer at the submit page or a malformed id', () => {
    expect(readViewerPath('/observations/submit')).toBeNull()
    expect(readViewerPath('/observations/not-an-id')).toBeNull()
  })

  it.each([
    ['#/view/observations', '/observations'],
    ['#/view/observations?zone=["3028"]', '/observations?zone=["3028"]'],
    ['#/view/avalanches', '/observations/avalanches'],
    [`#/view/avalanches/${ID}`, `/observations/avalanches/${ID}`],
    [`#/view/observations/${ID}`, `/observations/${ID}`],
    ['#/view/visual?trigger=["Human"]', '/observations/avalanches?trigger=["Human"]'],
    [`#/observation/${ID}`, `/observations/${ID}`],
    [`#/avalanche/${ID}`, `/observations/avalanches/${ID}`],
    ['#/form', '/observations/submit'],
    ['#/advanced-form', '/observations/submit'],
  ])('lands the legacy link %s on %s', (hash, target) => {
    expect(legacyHashTarget(hash)).toBe(target)
  })

  it('ignores a hash that is not a widget route', () => {
    expect(legacyHashTarget('#main-content')).toBeNull()
    expect(legacyHashTarget('')).toBeNull()
  })
})
