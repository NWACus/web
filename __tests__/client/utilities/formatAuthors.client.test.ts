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
    expect(formatAuthors([author('Alice Smith')])).toBe('Alice Smith')
  })

  it('joins two authors with "&"', () => {
    expect(formatAuthors([author('Alice Smith'), author('Bob Jones')])).toBe(
      'Alice Smith & Bob Jones',
    )
  })

  it('joins three authors with commas and "&"', () => {
    expect(
      formatAuthors([author('Alice Smith'), author('Bob Jones'), author('Charlie Brown')]),
    ).toBe('Alice Smith, Bob Jones & Charlie Brown')
  })

  it('joins four authors with commas and "&"', () => {
    expect(
      formatAuthors([
        author('Alice Smith'),
        author('Bob Jones'),
        author('Charlie Brown'),
        author('Diana Prince'),
      ]),
    ).toBe('Alice Smith, Bob Jones, Charlie Brown & Diana Prince')
  })

  it('filters out authors without names before formatting', () => {
    expect(formatAuthors([author('Alice Smith'), noName(), author('Bob Jones')])).toBe(
      'Alice Smith & Bob Jones',
    )
  })

  it('returns single author when filtering leaves only one', () => {
    expect(formatAuthors([noName(), author('Alice Smith'), noName()])).toBe('Alice Smith')
  })
})
