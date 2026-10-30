import { config } from '@/middleware'
import { buildNotFoundReport } from '@/utilities/notFoundReport'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'

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
