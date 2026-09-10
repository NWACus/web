import { buildBreadcrumbs } from '@/components/Breadcrumbs/buildBreadcrumbs'

describe('buildBreadcrumbs', () => {
  it('returns no items for the center home path', () => {
    expect(buildBreadcrumbs({ center: 'dvac', path: '/' })).toEqual([])
  })

  it('yields cumulative hrefs for a multi-segment path and never links the last item', () => {
    const items = buildBreadcrumbs({
      center: 'dvac',
      path: '/blog/two-feet-of-right-side-up-pow-fell-overnight',
    })

    expect(items).toEqual([
      { name: 'blog', href: '/blog', isLast: false },
      {
        name: 'two feet of right side up pow fell overnight',
        href: null,
        isLast: true,
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
      { name: 'weather', href: null, isLast: false },
      { name: 'stations', href: null, isLast: false },
      { name: 'map', href: null, isLast: true },
    ])
  })

  it('links the stations crumb on NWAC, which has a stations index page', () => {
    const items = buildBreadcrumbs({ center: 'nwac', path: '/weather/stations/map' })

    expect(items).toEqual([
      { name: 'weather', href: null, isLast: false },
      { name: 'stations', href: '/weather/stations', isLast: false },
      { name: 'map', href: null, isLast: true },
    ])
  })

  it('does not link intermediate crumbs of a nested CMS path', () => {
    const items = buildBreadcrumbs({ center: 'dvac', path: '/education/classes/field-classes' })

    expect(items).toEqual([
      { name: 'education', href: null, isLast: false },
      { name: 'classes', href: null, isLast: false },
      { name: 'field classes', href: null, isLast: true },
    ])
  })

  it('links intermediate crumbs of native routes that have pages', () => {
    const items = buildBreadcrumbs({ center: 'dvac', path: '/observations/avalanches/12345' })

    expect(items).toEqual([
      { name: 'observations', href: '/observations', isLast: false },
      { name: 'avalanches', href: null, isLast: false },
      { name: '12345', href: null, isLast: true },
    ])
  })

  it('decodes percent-encoded segments', () => {
    const items = buildBreadcrumbs({ center: 'dvac', path: '/blog/caf%C3%A9-notes' })

    expect(items[1].name).toBe('café notes')
  })
})
