import { publishedFilter } from '@/utilities/publishedFilter'

describe('publishedFilter', () => {
  it('requires a published status', () => {
    const where = publishedFilter()
    expect(where.and?.[0]).toEqual({ _status: { equals: 'published' } })
  })

  it('excludes documents with a future publishedAt and allows missing dates', () => {
    const before = new Date().toISOString()
    const dateClause = publishedFilter().and?.[1]
    const after = new Date().toISOString()

    const orClauses = dateClause && 'or' in dateClause ? dateClause.or : undefined
    const publishedAtField = orClauses?.[0]?.publishedAt
    const lessThanEqual =
      publishedAtField && !Array.isArray(publishedAtField)
        ? publishedAtField.less_than_equal
        : undefined

    expect(typeof lessThanEqual).toBe('string')
    if (typeof lessThanEqual === 'string') {
      expect(lessThanEqual >= before && lessThanEqual <= after).toBe(true)
    }
    expect(orClauses?.[1]).toEqual({ publishedAt: { exists: false } })
  })
})
