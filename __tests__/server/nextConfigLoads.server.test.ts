/**
 * @jest-environment node
 */

import { execFileSync } from 'node:child_process'

import { AVALANCHE_CENTERS, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'

// Loads the config the way `next build` does, so an `@/` import anywhere in its import chain
// (which Next's config loader can't resolve) fails here instead of in the build. It runs in a
// child process because Next's .ts require hook doesn't reliably apply inside Jest's sandbox.
const LOAD_CONFIG = `
  require('next/dist/server/config')
    .default(require('next/constants').PHASE_PRODUCTION_BUILD, process.cwd())
    .then((config) => console.log(JSON.stringify(config.images.remotePatterns.map((p) => p.hostname))))
`

// Its domain is unique and outside the root domain, so only its own pattern could allow it
const NON_PRODUCTION_SLUG = 'bac'

describe('next.config.ts', () => {
  it('loads and allows next/image from production tenant custom domains only', () => {
    const productionSlugs = Object.keys(AVALANCHE_CENTERS)
      .filter(isValidTenantSlug)
      .filter((slug) => slug !== NON_PRODUCTION_SLUG)

    const output = execFileSync(process.execPath, ['-e', LOAD_CONFIG], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_PUBLIC_ROOT_DOMAIN: 'avy-fx.org',
        PRODUCTION_TENANTS: productionSlugs.join(','),
      },
    })
    // The loader may log before the result, so read the last line
    const hostnames = new Set<unknown>(JSON.parse(output.trim().split('\n').pop() ?? '[]'))

    for (const slug of productionSlugs) {
      const { customDomain } = AVALANCHE_CENTERS[slug]
      expect({ slug, allowed: hostnames.has(customDomain) }).toEqual({ slug, allowed: true })
    }
    expect(hostnames.has(AVALANCHE_CENTERS[NON_PRODUCTION_SLUG].customDomain)).toBe(false)
  }, 60_000)
})
