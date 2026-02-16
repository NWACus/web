import { BuiltInPage, Page, Post } from '@/payload-types'
import { handleReferenceURL } from '@/utilities/handleReferenceURL'

describe('handleReferenceURL', () => {
  describe('when type is external', () => {
    it('should return URL when type is external', () => {
      const result = handleReferenceURL({
        url: 'https://example.com',
        type: 'external',
      })
      expect(result).toBe('https://example.com')
    })
  })

  describe('when type is internal with', () => {
    it('should return URL for builtInPages reference', () => {
      const result = handleReferenceURL({
        url: 'https://example.com',
        type: 'internal',
        reference: {
          relationTo: 'builtInPages',
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          value: { url: '/built-in-page' } as BuiltInPage,
        },
      })

      expect(result).toBe('/built-in-page')
    })
    it('should return URL for page reference', () => {
      const result = handleReferenceURL({
        url: 'https://example.com',
        type: 'internal',
        reference: {
          relationTo: 'pages',
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          value: { slug: 'test-page' } as Page,
        },
      })

      expect(result).toBe('/test-page')
    })
    it('should return URL for post reference', () => {
      const result = handleReferenceURL({
        url: 'https://example.com',
        type: 'internal',
        reference: {
          relationTo: 'posts',
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          value: { slug: 'my-blog-post' } as Post,
        },
      })

      expect(result).toBe('/blog/my-blog-post')
    })
  })

  describe('edge cases', () => {
    it('should handle empty slug', () => {
      const result = handleReferenceURL({
        url: 'https://example.com',
        type: 'internal',
        reference: {
          relationTo: 'pages',
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          value: { slug: '' } as Page,
        },
      })

      expect(result).toBe('/')
    })
  })
})
