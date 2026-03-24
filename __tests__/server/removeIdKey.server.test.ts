import { removeIdKey } from '@/utilities/removeIdKey'

describe('removeIdKey', () => {
  it('removes top-level id key', () => {
    expect(removeIdKey({ id: 1, name: 'test' })).toEqual({ name: 'test' })
  })

  it('removes nested id keys', () => {
    const input = {
      id: 1,
      block: { id: 'abc', type: 'text', content: 'hello' },
    }
    expect(removeIdKey(input)).toEqual({
      block: { type: 'text', content: 'hello' },
    })
  })

  it('removes id keys from objects inside arrays', () => {
    const input = {
      id: 1,
      items: [
        { id: 'a', label: 'one' },
        { id: 'b', label: 'two' },
      ],
    }
    expect(removeIdKey(input)).toEqual({
      items: [{ label: 'one' }, { label: 'two' }],
    })
  })

  it('preserves keys that contain "id" but are not exactly "id"', () => {
    const input = { id: 1, videoId: 'xyz', blockId: 42 }
    expect(removeIdKey(input)).toEqual({ videoId: 'xyz', blockId: 42 })
  })

  it('handles deeply nested structures', () => {
    const input = {
      id: 1,
      layout: [
        {
          id: 'row1',
          blockType: 'text',
          columns: [
            {
              id: 'col1',
              content: { id: 'rich1', text: 'hello' },
            },
          ],
        },
      ],
    }
    expect(removeIdKey(input)).toEqual({
      layout: [
        {
          blockType: 'text',
          columns: [
            {
              content: { text: 'hello' },
            },
          ],
        },
      ],
    })
  })

  it('returns primitives unchanged', () => {
    expect(removeIdKey('hello')).toBe('hello')
    expect(removeIdKey(42)).toBe(42)
    expect(removeIdKey(null)).toBe(null)
    expect(removeIdKey(undefined)).toBe(undefined)
    expect(removeIdKey(true)).toBe(true)
  })

  it('handles empty objects and arrays', () => {
    expect(removeIdKey({})).toEqual({})
    expect(removeIdKey([])).toEqual([])
  })

  it('handles arrays of primitives', () => {
    expect(removeIdKey([1, 2, 3])).toEqual([1, 2, 3])
    expect(removeIdKey(['a', 'b'])).toEqual(['a', 'b'])
  })
})
