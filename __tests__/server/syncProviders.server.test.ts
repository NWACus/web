import {
  droppedSourceValues,
  matchLocalProviders,
  sourceProviders,
  syncLine,
  unmatchedSheetProviders,
} from '@/services/courseImport/syncProviders'

const tables = {
  providers: [
    {
      id: 1,
      name: 'Snowbird Mountain Guides',
      slug: 'snowbird-mountain-guides',
      details: null,
      email: 'guides@example.org',
      phone: null,
      website: 'https://example.org',
      location_address: null,
      location_city: 'Salt Lake City',
      location_state: 'UT',
      location_zip: null,
    },
    { id: 2, name: null },
  ],
  courseTypes: [
    { parent_id: 1, value: 'rec-1' },
    { parent_id: 1, value: 'not-a-course-type' },
    { parent_id: 1, value: 'rescue' },
  ],
  statesServiced: [{ parent_id: 1, value: 'UT' }],
}

describe('sourceProviders', () => {
  it('builds published Provider data from the source tables, dropping unknown values', () => {
    expect(sourceProviders(tables)).toEqual([
      {
        name: 'Snowbird Mountain Guides',
        slug: 'snowbird-mountain-guides',
        details: null,
        email: 'guides@example.org',
        phone: null,
        website: 'https://example.org',
        location: { address: null, city: 'Salt Lake City', state: 'UT', zip: null },
        statesServiced: ['UT'],
        courseTypes: ['rec-1', 'rescue'],
        _status: 'published',
      },
    ])
  })

  it('leaves the slug blank for the slug field to generate when the source has none', () => {
    const [provider] = sourceProviders({
      providers: [{ id: 3, name: 'New Guides' }],
      courseTypes: [],
      statesServiced: [],
    })
    expect(provider.slug).toBe('')
    expect(provider.location?.state).toBeNull()
  })
})

describe('matchLocalProviders', () => {
  it('matches by name ignoring case and spacing', () => {
    const [provider] = sourceProviders(tables)
    expect(
      matchLocalProviders([provider], [{ id: 9, name: 'snowbird   mountain guides' }])[0].localId,
    ).toBe(9)
    expect(matchLocalProviders([provider], [])[0].localId).toBeUndefined()
  })
})

describe('unmatchedSheetProviders', () => {
  it('lists each unmatched sheet Provider once', () => {
    const sheet = [
      'Provider,Title',
      'Snowbird Mountain Guides,A',
      'Kaf Adventures,B',
      'kaf  adventures,C',
      ',D',
    ].join('\n')
    expect(unmatchedSheetProviders(sourceProviders(tables), sheet)).toEqual(['kaf  adventures'])
  })
})

describe('syncLine', () => {
  it('says whether the Provider is created or updated, and marks a dry run', () => {
    const [data] = sourceProviders(tables)
    expect(syncLine({ data, localId: 9 }, false)).toBe('Update Snowbird Mountain Guides')
    expect(syncLine({ data, localId: undefined }, true)).toBe(
      '[dry run] Create Snowbird Mountain Guides',
    )
  })
})

describe('droppedSourceValues', () => {
  it('lists every value the copy leaves out, and Providers with no name', () => {
    expect(
      droppedSourceValues({
        ...tables,
        providers: [{ ...tables.providers[0], location_state: 'Utah' }, tables.providers[1]],
        statesServiced: [
          { parent_id: 1, value: 'UT' },
          { parent_id: 1, value: 'XX' },
        ],
      }),
    ).toEqual([
      'Snowbird Mountain Guides: Course Type "not-a-course-type"',
      'Snowbird Mountain Guides: state serviced "XX"',
      'Snowbird Mountain Guides: location state "Utah"',
      'Provider 2: no name, so the whole Provider',
    ])
  })

  it('reports nothing when every value is known', () => {
    expect(
      droppedSourceValues({
        providers: [tables.providers[0]],
        courseTypes: [{ parent_id: 1, value: 'rec-1' }],
        statesServiced: [{ parent_id: 1, value: 'UT' }],
      }),
    ).toEqual([])
  })
})
