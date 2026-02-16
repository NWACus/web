import { toKebabCase } from '@/utilities/toKebabCase'

describe('toKebabCase', () => {
  it('converts camelCase to kebab-case', () => {
    expect(toKebabCase('helloWorld')).toBe('hello-world')
  })

  it('converts PascalCase to kebab-case', () => {
    expect(toKebabCase('HelloWorld')).toBe('hello-world')
  })

  it('converts spaces to hyphens', () => {
    expect(toKebabCase('hello world')).toBe('hello-world')
  })

  it('converts multiple spaces to hyphens', () => {
    expect(toKebabCase('hello   world')).toBe('hello-world')
  })

  it('handles mixed camelCase and spaces', () => {
    expect(toKebabCase('helloWorld foo')).toBe('hello-world-foo')
  })

  it('lowercases all characters', () => {
    expect(toKebabCase('HELLO')).toBe('hello')
  })

  it('handles already-kebab-case strings', () => {
    expect(toKebabCase('hello-world')).toBe('hello-world')
  })

  it('handles single word', () => {
    expect(toKebabCase('hello')).toBe('hello')
  })
})
