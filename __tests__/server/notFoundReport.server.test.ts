import {
  buildNotFoundReport,
  extractSitemapLocs,
  forecastZonePaths,
} from '@/utilities/notFoundReport'

const livePaths = [
  '/',
  '/about/about-us',
  '/about/employment',
  '/blog/meet-liz',
  '/blog/annual-report',
  '/about/annual-report',
]

describe('buildNotFoundReport', () => {
  it('suggests the live path whose last segment matches', () => {
    const { redirects } = buildNotFoundReport(
      [
        { path: '/2024/01/15/meet-liz/', hits: 40 },
        { path: '/jobs/Employment.html', hits: 12 },
      ],
      livePaths,
    )

    expect(redirects).toEqual([
      { from: '/2024/01/15/meet-liz', to: '/blog/meet-liz', hits: 40 },
      { from: '/jobs/Employment.html', to: '/about/employment', hits: 12 },
    ])
  })

  it('leaves `to` empty when there is no match or more than one', () => {
    const { redirects } = buildNotFoundReport(
      [
        { path: '/annual-report', hits: 9 },
        { path: '/mountain-weather-archive', hits: 3 },
      ],
      livePaths,
    )

    expect(redirects).toEqual([
      { from: '/annual-report', to: null, hits: 9 },
      { from: '/mountain-weather-archive', to: null, hits: 3 },
    ])
  })

  it('merges paths that normalize to the same `from` and sorts by hits', () => {
    const { redirects } = buildNotFoundReport(
      [
        { path: '/old-page', hits: 2 },
        { path: '/popular', hits: 5 },
        { path: '/old-page/', hits: 4 },
        { path: '/old-page?utm_source=x', hits: 1 },
      ],
      livePaths,
    )

    expect(redirects.map(({ from, hits }) => [from, hits])).toEqual([
      ['/old-page', 7],
      ['/popular', 5],
    ])
  })

  it('sets aside dead legacy paths, paths middleware skips, probes, and paths that are live now', () => {
    const { redirects, excluded } = buildNotFoundReport(
      [
        { path: '/classes-events/list/', hits: 30 },
        { path: '/favicon.ico', hits: 20 },
        { path: '/api/oembed/1.0/embed', hits: 10 },
        { path: '/.well-known/security.txt', hits: 5 },
        { path: '/about/about-us', hits: 1 },
      ],
      livePaths,
    )

    expect(redirects).toEqual([])
    expect(excluded).toEqual([
      { path: '/classes-events/list', hits: 30, reason: 'dead-legacy-path' },
      { path: '/favicon.ico', hits: 20, reason: 'not-redirectable' },
      { path: '/api/oembed/1.0/embed', hits: 10, reason: 'not-redirectable' },
      { path: '/.well-known/security.txt', hits: 5, reason: 'probe' },
      { path: '/about/about-us', hits: 1, reason: 'live-path' },
    ])
  })
})

describe('extractSitemapLocs', () => {
  it('reads <loc> entries from a sitemap index and a url set', () => {
    const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>https://nwac.us/pages-sitemap.xml</loc></sitemap>
<sitemap><loc>https://nwac.us/posts-sitemap.xml</loc></sitemap>
</sitemapindex>`
    const urlset = `<urlset><url><loc>
  https://nwac.us/about/about-us
</loc><lastmod>2026-09-01</lastmod></url></urlset>`

    expect(extractSitemapLocs(index)).toEqual([
      'https://nwac.us/pages-sitemap.xml',
      'https://nwac.us/posts-sitemap.xml',
    ])
    expect(extractSitemapLocs(urlset)).toEqual(['https://nwac.us/about/about-us'])
  })
})

describe('forecastZonePaths', () => {
  it('builds routes for active zones only, so old zone URLs can be matched to them', () => {
    const zonePaths = forecastZonePaths({
      zones: [
        { status: 'active', url: 'https://nwac.us/forecasts/avalanche/mt-hood' },
        { status: 'disabled', url: 'http://www.nwac.us/avalanche-forecast/current/mt-hood' },
        { status: 'active', url: 'https://nwac.us/forecasts/avalanche/olympics/' },
      ],
    })

    expect(zonePaths).toEqual([
      '/forecasts/avalanche',
      '/forecasts/avalanche/mt-hood',
      '/forecasts/avalanche/olympics',
    ])
    expect(
      buildNotFoundReport([{ path: '/avalanche-forecast/current/mt-hood', hits: 20 }], zonePaths)
        .redirects,
    ).toEqual([
      {
        from: '/avalanche-forecast/current/mt-hood',
        to: '/forecasts/avalanche/mt-hood',
        hits: 20,
      },
    ])
  })
})
