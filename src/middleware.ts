import { NextRequest, NextResponse } from 'next/server'
import { getURL } from './utilities/getURL'
import { getProductionTenantSlugs } from './utilities/tenancy/getProductionTenants'

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     * 5. /media and /thumbnail (inside /public)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+|media|thumbnail).*)',
  ],
}

const PRODUCTION_TENANTS = getProductionTenantSlugs()

const TENANTS: { slug: string; customDomain: string }[] = [
  { slug: 'nwac', customDomain: 'nwac.us' },
  { slug: 'sac', customDomain: 'sierraavalanchecenter.org' },
  { slug: 'snfac', customDomain: 'sawtoothavalanche.com' },
]

export default async function middleware(req: NextRequest) {
  const host = new URL(getURL()).host
  const requestedHost = req.headers.get('host')
  const isDraftMode = req.cookies.has('__prerender_bypass')
  const hasNextInPath = req.nextUrl.pathname.includes('/next/')
  const isSeedEndpoint = req.nextUrl.pathname.includes('/next/seed')

  // If request is to root domain with tenant in path
  if (host && requestedHost && requestedHost === host) {
    const pathSegments = req.nextUrl.pathname.split('/').filter(Boolean)

    // Check if the first path segment matches a tenant slug
    if (pathSegments.length > 0) {
      const potentialTenant = pathSegments[0]
      const tenant = TENANTS.find((t) => t.slug === potentialTenant)

      if (tenant && !isDraftMode && !hasNextInPath) {
        // Redirect to the tenant's subdomain or custom domain
        const redirectUrl = new URL(req.nextUrl.clone())
        redirectUrl.host = PRODUCTION_TENANTS.includes(tenant.slug)
          ? tenant.customDomain
          : `${tenant.slug}.${host}`

        // Remove the tenant slug from the path for the redirect
        redirectUrl.pathname = `/${pathSegments.slice(1).join('/')}`

        console.log(`redirecting ${req.nextUrl.toString()} to ${redirectUrl.toString()}`)
        return NextResponse.redirect(redirectUrl, process.env.NODE_ENV === 'production' ? 308 : 302)
      }
    }
  }

  // If request is not to root domain
  if (host && requestedHost && !isSeedEndpoint) {
    for (const { slug, customDomain } of TENANTS) {
      if (requestedHost === `${customDomain}` || requestedHost === `${slug}.${host}`) {
        const original = req.nextUrl.clone()
        original.host = requestedHost
        const rewrite = req.nextUrl.clone()

        if (req.nextUrl.pathname.startsWith('/admin')) {
          return
        }

        rewrite.pathname = `/${slug}${rewrite.pathname}`
        console.log(`rewrote ${original.toString()} to ${rewrite.toString()}`)
        return NextResponse.rewrite(rewrite)
      }
    }
  }
}
