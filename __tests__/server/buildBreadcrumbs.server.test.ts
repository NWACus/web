import { buildBreadcrumbs } from '@/components/Breadcrumbs/buildBreadcrumbs'

describe('buildBreadcrumbs', () => {
  describe('URL derivation', () => {
    it('returns no items for the center home path', () => {
      expect(buildBreadcrumbs({ center: 'dvac', path: '/' })).toEqual([])
    })

    it('yields cumulative hrefs for a multi-segment path and never links the last item', () => {
      const items = buildBreadcrumbs({
        center: 'dvac',
        path: '/blog/two-feet-of-right-side-up-pow-fell-overnight',
      })

      expect(items).toEqual([
        { name: 'blog', href: '/blog', isLast: false, isDerived: true },
        {
          name: 'two feet of right side up pow fell overnight',
          href: null,
          isLast: true,
          isDerived: true,
        },
      ])
    })

    it('replaces dashes with spaces in derived names', () => {
      const items = buildBreadcrumbs({ center: 'dvac', path: '/observations/submit-an-obs' })

      expect(items.map((item) => item.name)).toEqual(['observations', 'submit an obs'])
    })

    it('does not link known paths without pages, including stations on a non-NWAC center', () => {
      const items = buildBreadcrumbs({ center: 'dvac', path: '/weather/stations/map' })

      expect(items).toEqual([
        { name: 'weather', href: null, isLast: false, isDerived: true },
        { name: 'stations', href: null, isLast: false, isDerived: true },
        { name: 'map', href: null, isLast: true, isDerived: true },
      ])
    })

    it('links the stations crumb on NWAC, which has a stations index page', () => {
      const items = buildBreadcrumbs({ center: 'nwac', path: '/weather/stations/map' })

      expect(items).toEqual([
        { name: 'weather', href: null, isLast: false, isDerived: true },
        { name: 'stations', href: '/weather/stations', isLast: false, isDerived: true },
        { name: 'map', href: null, isLast: true, isDerived: true },
      ])
    })

    it('does not link intermediate crumbs of a nested CMS path', () => {
      const items = buildBreadcrumbs({ center: 'dvac', path: '/education/classes/field-classes' })

      expect(items).toEqual([
        { name: 'education', href: null, isLast: false, isDerived: true },
        { name: 'classes', href: null, isLast: false, isDerived: true },
        { name: 'field classes', href: null, isLast: true, isDerived: true },
      ])
    })

    it('links intermediate crumbs of native routes that have pages', () => {
      const items = buildBreadcrumbs({ center: 'dvac', path: '/observations/avalanches/12345' })

      expect(items).toEqual([
        { name: 'observations', href: '/observations', isLast: false, isDerived: true },
        { name: 'avalanches', href: null, isLast: false, isDerived: true },
        { name: '12345', href: null, isLast: true, isDerived: true },
      ])
    })

    it('decodes percent-encoded segments', () => {
      const items = buildBreadcrumbs({ center: 'dvac', path: '/blog/caf%C3%A9-notes' })

      expect(items[1].name).toBe('café notes')
    })
  })

  describe('overrides', () => {
    it('replaces the leaf name with title and marks it non-derived', () => {
      const items = buildBreadcrumbs({
        center: 'dvac',
        path: '/blog/two-feet-of-pow',
        title: 'Two Feet of Pow!',
      })

      expect(items).toEqual([
        { name: 'blog', href: '/blog', isLast: false, isDerived: true },
        { name: 'Two Feet of Pow!', href: null, isLast: true, isDerived: false },
      ])
    })

    it('replaces intermediate and leaf names from labels keyed by href', () => {
      const items = buildBreadcrumbs({
        center: 'nwac',
        path: '/forecasts/avalanche/stevens-pass/archive/2026-01-15',
        labels: {
          '/forecasts/avalanche/stevens-pass': 'Stevens Pass',
          '/forecasts/avalanche/stevens-pass/archive/2026-01-15': 'January 15, 2026',
        },
      })

      expect(items).toEqual([
        { name: 'forecasts', href: null, isLast: false, isDerived: true },
        { name: 'avalanche', href: '/forecasts/avalanche', isLast: false, isDerived: true },
        {
          name: 'Stevens Pass',
          href: '/forecasts/avalanche/stevens-pass',
          isLast: false,
          isDerived: false,
        },
        {
          name: 'archive',
          href: '/forecasts/avalanche/stevens-pass/archive',
          isLast: false,
          isDerived: true,
        },
        { name: 'January 15, 2026', href: null, isLast: true, isDerived: false },
      ])
    })

    it('ignores labels whose href does not appear in the path', () => {
      const items = buildBreadcrumbs({
        center: 'dvac',
        path: '/blog/some-post',
        labels: { '/events': 'Events', '/blog/other-post': 'Other' },
      })

      expect(items).toEqual([
        { name: 'blog', href: '/blog', isLast: false, isDerived: true },
        { name: 'some post', href: null, isLast: true, isDerived: true },
      ])
    })

    it('lets title win over a labels entry for the leaf', () => {
      const items = buildBreadcrumbs({
        center: 'dvac',
        path: '/blog/some-post',
        title: 'From Title',
        labels: { '/blog/some-post': 'From Labels' },
      })

      expect(items[1]).toEqual({ name: 'From Title', href: null, isLast: true, isDerived: false })
    })

    it('keeps an explicit label verbatim, without dash replacement', () => {
      const items = buildBreadcrumbs({
        center: 'dvac',
        path: '/blog/some-post',
        title: 'iPhone tips - part-one',
      })

      expect(items[1].name).toBe('iPhone tips - part-one')
    })
  })
})
