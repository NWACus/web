import {
  extractAllInternalUrls,
  findNavigationItemBySlug,
  getCanonicalUrlsFromNavigation,
  getNavigationPathForSlug,
} from '../../src/components/Header/utils-pure'

import type { TopLevelNavItem } from '../../src/components/Header/utils'

describe('Header Utilities', () => {
  const mockNavItems: TopLevelNavItem[] = [
    {
      label: 'Forecasts',
      items: [
        {
          id: 'all',
          link: {
            type: 'internal',
            label: 'All Forecasts',
            url: '/forecasts/avalanche',
          },
        },
        {
          id: 'zones',
          items: [
            {
              id: 'olympics',
              link: {
                type: 'internal',
                label: 'Olympics',
                url: '/forecasts/avalanche/olympics',
              },
            },
            {
              id: 'stevens-pass',
              link: {
                type: 'internal',
                label: 'Stevens Pass',
                url: '/forecasts/avalanche/stevens-pass',
              },
            },
          ],
          link: {
            type: 'internal',
            label: 'Zones',
            url: '/forecasts/avalanche',
          },
        },
      ],
    },
    {
      label: 'Weather',
      items: [
        {
          id: 'stations',
          link: {
            type: 'internal',
            label: 'Weather Stations',
            url: '/weather/stations/map',
          },
        },
      ],
    },
    {
      link: {
        label: 'Blog',
        type: 'internal',
        url: '/blog',
      },
    },
    {
      label: 'Education',
      items: [
        {
          id: 'external-link',
          link: {
            type: 'external',
            label: 'External Course',
            url: 'https://external.com/course',
            newTab: true,
          },
        },
      ],
    },
  ]

  describe('extractAllInternalUrls', () => {
    it('extracts all internal URLs from navigation structure', () => {
      const urls = extractAllInternalUrls(mockNavItems)

      expect(urls).toEqual([
        '/blog',
        '/forecasts/avalanche',
        '/forecasts/avalanche/olympics',
        '/forecasts/avalanche/stevens-pass',
        '/weather/stations/map',
      ])
    })

    it('excludes external URLs', () => {
      const urls = extractAllInternalUrls(mockNavItems)

      expect(urls).not.toContain('https://external.com/course')
    })

    it('returns empty array for empty navigation', () => {
      const urls = extractAllInternalUrls([])

      expect(urls).toEqual([])
    })

    it('handles navigation items with no links', () => {
      const navWithNoLinks: TopLevelNavItem[] = [
        {
          label: 'Section',
          items: [
            {
              id: 'item1',
            },
          ],
        },
      ]

      const urls = extractAllInternalUrls(navWithNoLinks)

      expect(urls).toEqual([])
    })

    it('removes duplicates and sorts URLs', () => {
      const navWithDuplicates: TopLevelNavItem[] = [
        {
          link: {
            type: 'internal',
            label: 'Blog',
            url: '/blog',
          },
        },
        {
          link: {
            type: 'internal',
            label: 'Blog Again',
            url: '/blog',
          },
        },
        {
          link: {
            type: 'internal',
            label: 'About',
            url: '/about',
          },
        },
      ]

      const urls = extractAllInternalUrls(navWithDuplicates)

      expect(urls).toEqual(['/about', '/blog'])
    })
  })

  describe('findNavigationItemBySlug', () => {
    it('finds navigation item by slug in top-level items', () => {
      const item = findNavigationItemBySlug(mockNavItems, 'blog')

      expect(item).toEqual({
        link: {
          label: 'Blog',
          type: 'internal',
          url: '/blog',
        },
      })
    })

    it('finds navigation item by slug in nested items', () => {
      const item = findNavigationItemBySlug(mockNavItems, 'olympics')

      expect(item).toEqual({
        id: 'olympics',
        link: {
          type: 'internal',
          label: 'Olympics',
          url: '/forecasts/avalanche/olympics',
        },
      })
    })

    it('finds navigation item by slug in deeply nested items', () => {
      const item = findNavigationItemBySlug(mockNavItems, 'stevens-pass')

      expect(item).toEqual({
        id: 'stevens-pass',
        link: {
          type: 'internal',
          label: 'Stevens Pass',
          url: '/forecasts/avalanche/stevens-pass',
        },
      })
    })

    it('returns null when slug is not found', () => {
      const item = findNavigationItemBySlug(mockNavItems, 'nonexistent')

      expect(item).toBeNull()
    })

    it('returns null for empty navigation', () => {
      const item = findNavigationItemBySlug([], 'blog')

      expect(item).toBeNull()
    })

    it('handles complex URL paths correctly', () => {
      const item = findNavigationItemBySlug(mockNavItems, 'map')

      expect(item).toEqual({
        id: 'stations',
        link: {
          type: 'internal',
          label: 'Weather Stations',
          url: '/weather/stations/map',
        },
      })
    })
  })

  describe('getNavigationPathForSlug', () => {
    it('returns path for top-level navigation item', () => {
      const path = getNavigationPathForSlug(mockNavItems, 'blog')

      expect(path).toEqual(['/blog'])
    })

    it('returns path for nested navigation item', () => {
      const path = getNavigationPathForSlug(mockNavItems, 'olympics')

      expect(path).toEqual(['/forecasts/avalanche', '/forecasts/avalanche/olympics'])
    })

    it('returns path for deeply nested navigation item', () => {
      const path = getNavigationPathForSlug(mockNavItems, 'stevens-pass')

      expect(path).toEqual(['/forecasts/avalanche', '/forecasts/avalanche/stevens-pass'])
    })

    it('returns path for item with parent that has no link', () => {
      const navWithNoParentLink: TopLevelNavItem[] = [
        {
          label: 'Section',
          items: [
            {
              id: 'child',
              link: {
                type: 'internal',
                label: 'Child',
                url: '/section/child',
              },
            },
          ],
        },
      ]

      const path = getNavigationPathForSlug(navWithNoParentLink, 'child')

      expect(path).toEqual(['/section/child'])
    })

    it('returns empty array when slug is not found', () => {
      const path = getNavigationPathForSlug(mockNavItems, 'nonexistent')

      expect(path).toEqual([])
    })

    it('returns empty array for empty navigation', () => {
      const path = getNavigationPathForSlug([], 'blog')

      expect(path).toEqual([])
    })

    it('handles complex nested structure correctly', () => {
      const complexNav: TopLevelNavItem[] = [
        {
          label: 'Education',
          link: {
            type: 'internal',
            label: 'Education',
            url: '/education',
          },
          items: [
            {
              id: 'classes',
              link: {
                type: 'internal',
                label: 'Classes',
                url: '/education/classes',
              },
              items: [
                {
                  id: 'field-classes',
                  link: {
                    type: 'internal',
                    label: 'Field Classes',
                    url: '/education/classes/field-classes',
                  },
                },
              ],
            },
          ],
        },
      ]

      const path = getNavigationPathForSlug(complexNav, 'field-classes')

      expect(path).toEqual(['/education', '/education/classes', '/education/classes/field-classes'])
    })
  })

  describe('getCanonicalUrlsFromNavigation', () => {
    it('identifies pages that exist in navigation and should be excluded', () => {
      const navigationUrls = ['/about/about-us', '/about/team', '/forecasts/avalanche', '/blog']

      const pages = [
        { slug: 'about-us', updatedAt: '2023-01-01' },
        { slug: 'team', updatedAt: '2023-01-02' },
        { slug: 'contact', updatedAt: '2023-01-03' },
        { slug: 'avalanche', updatedAt: '2023-01-04' },
      ]

      const result = getCanonicalUrlsFromNavigation(navigationUrls, pages)

      expect(result.canonicalUrls).toEqual(navigationUrls)
      expect(result.excludedSlugs).toEqual(['about-us', 'team', 'avalanche'])
    })

    it('handles empty navigation URLs', () => {
      const pages = [
        { slug: 'about-us', updatedAt: '2023-01-01' },
        { slug: 'team', updatedAt: '2023-01-02' },
      ]

      const result = getCanonicalUrlsFromNavigation([], pages)

      expect(result.canonicalUrls).toEqual([])
      expect(result.excludedSlugs).toEqual([])
    })

    it('handles empty pages array', () => {
      const navigationUrls = ['/about/about-us', '/about/team']

      const result = getCanonicalUrlsFromNavigation(navigationUrls, [])

      expect(result.canonicalUrls).toEqual(navigationUrls)
      expect(result.excludedSlugs).toEqual([])
    })

    it('handles complex nested URLs correctly', () => {
      const navigationUrls = [
        '/education/classes/field-classes',
        '/education/classes/avalanche-awareness',
        '/forecasts/avalanche/olympics',
        '/weather/stations/map',
      ]

      const pages = [
        { slug: 'field-classes', updatedAt: '2023-01-01' },
        { slug: 'olympics', updatedAt: '2023-01-02' },
        { slug: 'map', updatedAt: '2023-01-03' },
        { slug: 'standalone-page', updatedAt: '2023-01-04' },
      ]

      const result = getCanonicalUrlsFromNavigation(navigationUrls, pages)

      expect(result.canonicalUrls).toEqual(navigationUrls)
      expect(result.excludedSlugs).toEqual(['field-classes', 'olympics', 'map'])
    })

    it('handles URLs with query parameters and fragments', () => {
      const navigationUrls = ['/about/contact-us', '/services/consultation']

      const pages = [
        { slug: 'contact-us', updatedAt: '2023-01-01' },
        { slug: 'consultation', updatedAt: '2023-01-02' },
        { slug: 'other-page', updatedAt: '2023-01-03' },
      ]

      const result = getCanonicalUrlsFromNavigation(navigationUrls, pages)

      expect(result.canonicalUrls).toEqual(navigationUrls)
      expect(result.excludedSlugs).toEqual(['contact-us', 'consultation'])
    })

    it('handles duplicate slugs in navigation correctly', () => {
      const navigationUrls = ['/section1/about', '/section2/about', '/unique-page']

      const pages = [
        { slug: 'about', updatedAt: '2023-01-01' },
        { slug: 'unique-page', updatedAt: '2023-01-02' },
      ]

      const result = getCanonicalUrlsFromNavigation(navigationUrls, pages)

      expect(result.canonicalUrls).toEqual(navigationUrls)
      // Should only have 'about' once in excluded slugs, even though it appears in multiple nav URLs
      expect(result.excludedSlugs).toEqual(['about', 'unique-page'])
    })
  })
})
