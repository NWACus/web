/**
 * Upstream API hosts for the NAC and AFP (WordPress) APIs.
 *
 * Both default to production and are overridable per deployment — set `NAC_HOST` to
 * `https://staging-api.avalanche.org` and every native product surface follows, because all
 * native data goes through `nacFetch`/`afpFetch`. This is the native equivalent of the
 * `nacWidgetsConfig.devMode` toggle, which only redirects the embedded widget scripts.
 *
 * Kept in its own module (rather than inline in `nac.ts`) so tests can resolve the same hosts
 * their msw handlers must intercept without pulling in the Payload config. Read at module load,
 * so a Vercel build needs the var present at build time, not just at runtime.
 */
export const nacApiHost = process.env.NAC_HOST || 'https://api.avalanche.org'

export const afpApiHost = process.env.AFP_HOST || 'https://forecasts.avalanche.org'
