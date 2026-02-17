import { getAuthorInitials } from '@/utilities/getAuthorInitials'

describe('getAuthorInitials', () => {
  it('returns initials for a two-part name', () => {
    expect(getAuthorInitials('John Doe')).toBe('JD')
  })

  it('returns initial for a single name', () => {
    expect(getAuthorInitials('Alice')).toBe('A')
  })

  it('returns initials for a three-part name', () => {
    expect(getAuthorInitials('Mary Jane Watson')).toBe('MJW')
  })

  it('handles single character names', () => {
    expect(getAuthorInitials('A B')).toBe('AB')
  })
})
