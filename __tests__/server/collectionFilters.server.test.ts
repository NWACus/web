import { getTenantAndPublishedFilter } from '@/utilities/collectionFilters'

const baseProps: Parameters<typeof getTenantAndPublishedFilter>[0] = {
  data: {},
  req: {
    headers: new Headers(),
  },
  relationTo: 'pages',
}

describe('getTenantAndPublishedFilter', () => {
  it('adds the published status filter for page references', () => {
    expect(
      getTenantAndPublishedFilter({
        ...baseProps,
        relationTo: 'pages',
      }),
    ).toEqual({
      _status: {
        equals: 'published',
      },
    })
  })

  it('preserves tenant scoping when filtering page references', () => {
    expect(
      getTenantAndPublishedFilter({
        ...baseProps,
        data: { tenant: 7 },
        relationTo: 'posts',
      }),
    ).toEqual({
      and: [
        {
          tenant: {
            equals: 7,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    })
  })

  it('does not add a draft status filter for built-in page references', () => {
    expect(
      getTenantAndPublishedFilter({
        ...baseProps,
        data: { tenant: 7 },
        relationTo: 'builtInPages',
      }),
    ).toEqual({
      tenant: {
        equals: 7,
      },
    })
  })
})
