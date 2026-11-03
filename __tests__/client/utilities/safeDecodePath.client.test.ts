import { isDecodablePath, safeDecodePath } from '@/utilities/path'

describe('safeDecodePath', () => {
  it('leaves a decoded path unchanged', () => {
    expect(safeDecodePath('/&')).toBe('/&')
    expect(safeDecodePath('/blog/some-post')).toBe('/blog/some-post')
    expect(safeDecodePath('/a+b')).toBe('/a+b')
  })

  it('decodes a percent-encoded path', () => {
    expect(safeDecodePath('/%26')).toBe('/&')
    expect(safeDecodePath('/blog/%26')).toBe('/blog/&')
    expect(safeDecodePath('/a%2Bb')).toBe('/a+b')
    expect(safeDecodePath('/a%2Fb')).toBe('/a/b')
  })

  it('decodes only one level of encoding', () => {
    expect(safeDecodePath('/%2526')).toBe('/%26')
  })

  it('returns a malformed path unchanged', () => {
    expect(safeDecodePath('/%E0%A4%A')).toBe('/%E0%A4%A')
    expect(safeDecodePath('/100%')).toBe('/100%')
  })
})

describe('isDecodablePath', () => {
  it('accepts plain and well-formed encoded paths', () => {
    expect(isDecodablePath('/&')).toBe(true)
    expect(isDecodablePath('/%26')).toBe(true)
    expect(isDecodablePath('/100%25')).toBe(true)
  })

  it('rejects a stray "%"', () => {
    expect(isDecodablePath('/100%')).toBe(false)
    expect(isDecodablePath('/%E0%A4%A')).toBe(false)
  })
})
