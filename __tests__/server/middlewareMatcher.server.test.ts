import { config } from '@/middleware'

// Next compiles each matcher source into an anchored regex; the catch-all is already valid regex
// syntax, so anchoring it reproduces which paths reach middleware.
const catchAll = new RegExp(`^${config.matcher[0]}$`)

const skippedPaths = ['/monitoring', '/monitoring/', '/ingest', '/ingest/e/', '/api/tenants']
const matchedPaths = ['/', '/sac/forecasts/avalanche', '/monitoring-stations', '/about/monitoring']

describe('middleware matcher', () => {
  it.each(skippedPaths)('skips %s', (path) => {
    expect(catchAll.test(path)).toBe(false)
  })

  it.each(matchedPaths)('runs on %s', (path) => {
    expect(catchAll.test(path)).toBe(true)
  })
})
