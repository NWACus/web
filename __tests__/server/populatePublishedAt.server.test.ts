import { populatePublishedAt } from '@/hooks/populatePublishedAt'

// Builds a minimal mock of the hook args; only the fields the hook actually reads are provided
function createArgs(overrides: {
  operation: 'create' | 'update'
  data: Record<string, unknown>
  req: { data: Record<string, unknown> }
  originalDoc?: Record<string, unknown>
}): Parameters<typeof populatePublishedAt>[0] {
  // @ts-expect-error - partial mock; only data, operation, originalDoc, and req.data are used by the hook
  return {
    context: {},
    originalDoc: {},
    ...overrides,
  }
}

describe('populatePublishedAt', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('create operation', () => {
    it('auto-sets publishedAt to now when not provided', () => {
      const result = populatePublishedAt(
        createArgs({
          operation: 'create',
          data: { title: 'Test Post' },
          req: { data: { title: 'Test Post' } },
        }),
      )

      expect(result).toEqual({
        title: 'Test Post',
        publishedAt: new Date('2026-01-15T12:00:00Z'),
      })
    })

    it('preserves user-provided publishedAt on create', () => {
      const userDate = '2025-12-01T10:00:00Z'
      const result = populatePublishedAt(
        createArgs({
          operation: 'create',
          data: { title: 'Test Post', publishedAt: userDate },
          req: { data: { title: 'Test Post', publishedAt: userDate } },
        }),
      )

      expect(result).toEqual({
        title: 'Test Post',
        publishedAt: userDate,
      })
    })
  })

  describe('update operation', () => {
    it('preserves user-provided publishedAt on update', () => {
      const userDate = '2025-06-15T09:00:00Z'
      const result = populatePublishedAt(
        createArgs({
          operation: 'update',
          data: { title: 'Updated Post', publishedAt: userDate },
          req: { data: { title: 'Updated Post', publishedAt: userDate } },
          originalDoc: { _status: 'published', publishedAt: '2025-01-01T00:00:00Z' },
        }),
      )

      expect(result).toEqual({
        title: 'Updated Post',
        publishedAt: userDate,
      })
    })

    it('auto-sets publishedAt to now when not provided on update', () => {
      const result = populatePublishedAt(
        createArgs({
          operation: 'update',
          data: { title: 'Updated Post' },
          req: { data: { title: 'Updated Post' } },
          originalDoc: { _status: 'draft' },
        }),
      )

      expect(result).toEqual({
        title: 'Updated Post',
        publishedAt: new Date('2026-01-15T12:00:00Z'),
      })
    })

    it('clears publishedAt when transitioning from published to draft', () => {
      const result = populatePublishedAt(
        createArgs({
          operation: 'update',
          data: { title: 'Post', _status: 'draft', publishedAt: '2025-01-01T00:00:00Z' },
          req: { data: { _status: 'draft', publishedAt: '2025-01-01T00:00:00Z' } },
          originalDoc: { _status: 'published', publishedAt: '2025-01-01T00:00:00Z' },
        }),
      )

      expect(result).toEqual({
        title: 'Post',
        _status: 'draft',
        publishedAt: null,
      })
    })

    it('does not clear publishedAt when saving a draft that was already a draft', () => {
      const result = populatePublishedAt(
        createArgs({
          operation: 'update',
          data: { title: 'Post', _status: 'draft' },
          req: { data: { _status: 'draft' } },
          originalDoc: { _status: 'draft' },
        }),
      )

      expect(result).toEqual({
        title: 'Post',
        _status: 'draft',
        publishedAt: new Date('2026-01-15T12:00:00Z'),
      })
    })

    it('does not modify data when req.data is missing', () => {
      const result = populatePublishedAt(
        createArgs({
          operation: 'update',
          data: { title: 'Post', publishedAt: '2025-01-01T00:00:00Z' },
          // @ts-expect-error - testing edge case with missing req.data
          req: {},
          originalDoc: { _status: 'published' },
        }),
      )

      expect(result).toEqual({
        title: 'Post',
        publishedAt: '2025-01-01T00:00:00Z',
      })
    })
  })
})
