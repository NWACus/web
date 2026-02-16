import {
  filterValidPublishedRelationships,
  filterValidRelationships,
  isValidPublishedRelationship,
  isValidRelationship,
} from '@/utilities/relationships'

describe('isValidRelationship', () => {
  it('returns true for a resolved object with id', () => {
    expect(isValidRelationship({ id: 1, name: 'Test' })).toBe(true)
  })

  it('returns true for an object with string id', () => {
    expect(isValidRelationship({ id: 'abc-123', title: 'Post' })).toBe(true)
  })

  it('returns false for a number (unresolved ID)', () => {
    expect(isValidRelationship(42)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidRelationship(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isValidRelationship(undefined)).toBe(false)
  })
})

describe('isValidPublishedRelationship', () => {
  it('returns true for a resolved object with published status', () => {
    expect(isValidPublishedRelationship({ id: 1, _status: 'published' })).toBe(true)
  })

  it('returns true for a resolved object with no _status (no drafts)', () => {
    expect(isValidPublishedRelationship({ id: 1 })).toBe(true)
  })

  it('returns true for a resolved object with null _status', () => {
    expect(isValidPublishedRelationship({ id: 1, _status: null })).toBe(true)
  })

  it('returns false for a draft object', () => {
    expect(isValidPublishedRelationship({ id: 1, _status: 'draft' })).toBe(false)
  })

  it('returns false for a number (unresolved ID)', () => {
    expect(isValidPublishedRelationship(42)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidPublishedRelationship(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isValidPublishedRelationship(undefined)).toBe(false)
  })
})

describe('filterValidRelationships', () => {
  it('filters out numbers, nulls, and undefineds', () => {
    const input = [{ id: 1, name: 'A' }, 42, null, { id: 2, name: 'B' }, undefined]
    const result = filterValidRelationships(input)
    expect(result).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ])
  })

  it('returns empty array for null input', () => {
    expect(filterValidRelationships(null)).toEqual([])
  })

  it('returns empty array for undefined input', () => {
    expect(filterValidRelationships(undefined)).toEqual([])
  })

  it('returns empty array when all items are invalid', () => {
    expect(filterValidRelationships([42, null, undefined])).toEqual([])
  })

  it('returns all items when all are valid objects', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    expect(filterValidRelationships(items)).toEqual(items)
  })
})

describe('filterValidPublishedRelationships', () => {
  it('filters out drafts, numbers, nulls, and undefineds', () => {
    const input = [
      { id: 1, _status: 'published' },
      { id: 2, _status: 'draft' },
      42,
      null,
      { id: 3 },
    ]
    const result = filterValidPublishedRelationships(input)
    expect(result).toEqual([{ id: 1, _status: 'published' }, { id: 3 }])
  })

  it('returns empty array for null input', () => {
    expect(filterValidPublishedRelationships(null)).toEqual([])
  })

  it('returns empty array for undefined input', () => {
    expect(filterValidPublishedRelationships(undefined)).toEqual([])
  })
})
