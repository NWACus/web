import type { Where } from 'payload'

// Published documents whose publishedAt is not in the future.
// Documents without a publishedAt are included.
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
