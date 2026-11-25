import middleware, { config } from '@/middleware'
import { buildNotFoundReport } from '@/utilities/notFoundReport'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'

const runsMiddleware = (path: string) =>
  unstable_doesMiddlewareMatch({ config, url: `https://www.example.org${path}` })

const notRedirectable = (path: string) =>
  buildNotFoundReport([{ path, hits: 1 }], []).excluded.some(
    ({ reason }) => reason === 'not-redirectable',
  )

const skippedPaths = [
  '/monitoring',
  '/monitoring/',
  '/monitoring?o=4504317391929344&p=4509675069702145&r=us',
  '/ingest',
  '/ingest/e/',
  '/api/tenants',
]
const matchedPaths = ['/', '/sac/forecasts/avalanche', '/monitoring-stations', '/about/monitoring']

describe('middleware matcher', () => {
  it.each(skippedPaths)('skips %s', (path) => {
    expect(runsMiddleware(path)).toBe(false)
  })

  it.each(matchedPaths)('runs on %s', (path) => {
    expect(runsMiddleware(path)).toBe(true)
  })
})

// notFoundReport keeps its own copy of the matcher's exclusions
describe('not-found report exclusions', () => {
  it.each(skippedPaths)('sets aside %s as not redirectable', (path) => {
    expect(notRedirectable(path)).toBe(true)
  })

  it.each(matchedPaths)('does not set aside %s as not redirectable', (path) => {
    expect(notRedirectable(path)).toBe(false)
  })
})

describe('dead legacy paths', () => {
  it.each([
    '/feeds',
    '/news-rss.xml',
    '/email-subscriptions',
    '/weather-station-map',
    '/classes-events/list/',
    '/forecasts/tabs/bottom-line',
    '/FAQ',
    '/ie-incompatible.html',
    '/wp-login.php',
    '/wp-sitemap.xml',
    '/wp-content/uploads/photo.jpg',
    '/xmlrpc.php',
    '/apple-touch-icon-120x120.png',
  ])('reaches middleware and returns 410 for %s', (path) => {
    expect(runsMiddleware(path)).toBe(true)
    const response = middleware(new NextRequest(`https://www.example.org${path}`))
    expect(response?.status).toBe(410)
  })

  it.each(['/favicon.ico', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png'])(
    'leaves %s to the static file',
    (path) => {
      expect(runsMiddleware(path)).toBe(false)
    },
  )

  it.each(['/sitemap.xml', '/this-path-does-not-exist-xyz', '/data-portal/csv/q'])(
    'does not return 410 for %s',
    (path) => {
      const response = middleware(new NextRequest(`https://www.example.org${path}`))
      expect(response?.status).not.toBe(410)
    },
  )
})
