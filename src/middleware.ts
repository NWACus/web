import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}

export const AvalancheCenterWebsites: { slug: string; domain: string }[] = [
  { slug: 'nwac', domain: 'nwac.us' },
  { slug: 'bac', domain: 'bridgeportavalanchecenter.org' },
  { slug: 'btac', domain: 'bridgertetonavalanchecenter.org' },
  { slug: 'cbac', domain: 'cbavalanchecenter.org' },
  { slug: 'cnfaic', domain: 'cnfaic.org' },
  { slug: 'coaa', domain: 'coavalanche.org' },
  { slug: 'esac', domain: 'esavalanche.org' },
  { slug: 'fac', domain: 'flatheadavalanche.org' },
  { slug: 'hpac', domain: 'hpavalanche.org' },
  { slug: 'ipac', domain: 'idahopanhandleavalanche.org' },
  { slug: 'kpac', domain: 'kachinapeaks.org' },
  { slug: 'msac', domain: 'shastaavalanche.org' },
  { slug: 'mwac', domain: 'mountwashingtonavalanchecenter.org' },
  { slug: 'pac', domain: 'payetteavalanche.org' },
  { slug: 'sac', domain: 'sierraavalanchecenter.org' },
  { slug: 'snfac', domain: 'sawtoothavalanche.com' },
  { slug: 'tac', domain: 'taosavalanchecenter.org' },
  { slug: 'wac', domain: 'wallowaavalanchecenter.org' },
  { slug: 'wcmac', domain: 'missoulaavalanche.org' },
]

const SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function middleware(req: NextRequest) {
  const host = new URL(SERVER_URL)?.host
  const requestedHost = req.headers.get('host')

  if (host && requestedHost) {
    // we want to encode the center outside the domain, but allow users to continue going to
    // their well-known domains for every center; so, we can rewrite a request for some path
    // under an existing domain to our central domain, moving the center into a path segment
    // or query parameter as necessary
    for (const { slug, domain } of AvalancheCenterWebsites) {
      if (
        requestedHost === `${domain}` || // production website, nwac.us
        requestedHost === `${slug}.${host}` // local testing, nwac.localhost:3000 or production, nwac.avy.com
      ) {
        const original = req.nextUrl.clone()
        original.host = requestedHost
        const rewrite = req.nextUrl.clone()
        rewrite.hostname = host
        if (req.nextUrl.pathname.startsWith('/admin')) {
          // PayloadCMS does not support dynamic routing for the admin panel, so
          // we need to encode the center as a query parameter
          rewrite.searchParams.set('default-payload-tenant', slug)
        } else {
          // for all other content, we can prepend the center as a path segment
          // and handle it in our src/app/(frontend)/[center]/... routes
          rewrite.pathname = `/${slug}${rewrite.pathname}` // original pathname has leading /
        }
        console.log(`rewrote ${original.toString()} to ${rewrite.toString()}`)
        return NextResponse.rewrite(rewrite)
      }
    }
  }
}
