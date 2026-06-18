import type { Where } from 'payload'

// Where clause matching published documents whose publishedAt is not in the future.
// Documents without a publishedAt are treated as published immediately.
export function publishedFilter(): Where {
  return {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        or: [
          {
            publishedAt: {
              less_than_equal: new Date().toISOString(),
            },
          },
          {
            publishedAt: {
              exists: false,
            },
          },
        ],
      },
    ],
  }
}
