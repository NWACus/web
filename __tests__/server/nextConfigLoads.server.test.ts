/**
 * @jest-environment node
 */

import { execFileSync } from 'node:child_process'

import { AVALANCHE_CENTERS } from '@/utilities/tenancy/avalancheCenters'

// Loads the config the way `next build` does, so an `@/` import anywhere in its import chain
// (which Next's config loader can't resolve) fails here instead of in the build. It runs in a
// child process because Next's .ts require hook doesn't reliably apply inside Jest's sandbox.
const LOAD_CONFIG = `
  require('next/dist/server/config')
    .default(require('next/constants').PHASE_PRODUCTION_BUILD, process.cwd())
    .then((config) => console.log(JSON.stringify(config.images.remotePatterns.map((p) => p.hostname))))
`

describe('next.config.ts', () => {
  it('loads and allows every center custom domain for next/image', () => {
    const output = execFileSync(process.execPath, ['-e', LOAD_CONFIG], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' },
    })
    // The loader may log before the result, so read the last line
    const hostnames = new Set<unknown>(JSON.parse(output.trim().split('\n').pop() ?? '[]'))

    for (const [slug, center] of Object.entries(AVALANCHE_CENTERS)) {
      expect({ slug, allowed: hostnames.has(center.customDomain) }).toEqual({ slug, allowed: true })
    }
  }, 60_000)
})
