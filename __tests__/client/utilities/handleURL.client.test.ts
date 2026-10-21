import { handleReferenceURL } from '@/utilities/handleReferenceURL'
import { buildBuiltInPage, buildPage, buildPost, buildStationPage } from '../../builders'

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
          value: buildBuiltInPage({ url: '/built-in-page' }),
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
          value: buildPage({ slug: 'test-page' }),
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
          value: buildPost({ slug: 'my-blog-post' }),
        },
      })

      expect(result).toBe('/blog/my-blog-post')
    })
    it('should return URL for station page reference', () => {
      const result = handleReferenceURL({
        type: 'internal',
        reference: {
          relationTo: 'stationPages',
          value: buildStationPage({ slug: 'alpental' }),
        },
      })

      expect(result).toBe('/weather/stations/alpental')
    })
  })

  describe('edge cases', () => {
    it('should handle empty slug', () => {
      const result = handleReferenceURL({
        url: 'https://example.com',
        type: 'internal',
        reference: {
          relationTo: 'pages',
          value: buildPage({ slug: '' }),
        },
      })

      expect(result).toBe('/')
    })
  })
})
