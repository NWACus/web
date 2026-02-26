import { normalizePath } from '@/utilities/path'

describe('normalizePath', () => {
  describe('default options (no leading slash)', () => {
    it('strips leading slash from a simple path', () => {
      expect(normalizePath('/hello')).toBe('hello')
    })

    it('strips multiple leading slashes', () => {
      expect(normalizePath('///hello')).toBe('hello')
    })

    it('strips trailing slashes', () => {
      expect(normalizePath('hello/')).toBe('hello')
    })

    it('strips both leading and trailing slashes', () => {
      expect(normalizePath('/hello/')).toBe('hello')
    })

    it('handles paths without slashes', () => {
      expect(normalizePath('hello')).toBe('hello')
    })

    it('handles multi-segment paths', () => {
      expect(normalizePath('/blog/post-1/')).toBe('blog/post-1')
    })

    it('handles empty string', () => {
      expect(normalizePath('')).toBe('')
    })
  })

  describe('with ensureLeadingSlash', () => {
    const opts = { ensureLeadingSlash: true }

    it('keeps existing leading slash', () => {
      expect(normalizePath('/hello', opts)).toBe('/hello')
    })

    it('adds leading slash when missing', () => {
      expect(normalizePath('hello', opts)).toBe('/hello')
    })

    it('collapses multiple leading slashes to one', () => {
      expect(normalizePath('///hello', opts)).toBe('/hello')
    })

    it('strips trailing slashes', () => {
      expect(normalizePath('/hello/', opts)).toBe('/hello')
    })

    it('handles multi-segment paths', () => {
      expect(normalizePath('blog/post-1/', opts)).toBe('/blog/post-1')
    })
  })
})
