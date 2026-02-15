import { formatAuthors } from '@/utilities/formatAuthors'

const author = (name: string) => ({ id: name, name })
const noName = () => ({ id: 'no-name' })

describe('formatAuthors', () => {
  it('returns empty string for empty array', () => {
    expect(formatAuthors([])).toBe('')
  })

  it('returns empty string when all authors have no name', () => {
    expect(formatAuthors([noName(), noName()])).toBe('')
  })

  it('returns the name for a single author', () => {
    expect(formatAuthors([author('Alice')])).toBe('Alice')
  })

  it('joins two authors with "and"', () => {
    expect(formatAuthors([author('Alice'), author('Bob')])).toBe('Alice and Bob')
  })

  it('joins three authors with commas and "and"', () => {
    expect(formatAuthors([author('Alice'), author('Bob'), author('Charlie')])).toBe(
      'Alice, Bob and Charlie',
    )
  })

  it('joins four authors with commas and "and"', () => {
    expect(
      formatAuthors([author('Alice'), author('Bob'), author('Charlie'), author('Diana')]),
    ).toBe('Alice, Bob, Charlie and Diana')
  })

  it('filters out authors without names before formatting', () => {
    expect(formatAuthors([author('Alice'), noName(), author('Bob')])).toBe('Alice and Bob')
  })

  it('returns single author when filtering leaves only one', () => {
    expect(formatAuthors([noName(), author('Alice'), noName()])).toBe('Alice')
  })
})
