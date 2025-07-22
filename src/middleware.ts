import { NextRequest, NextResponse } from 'next/server'
import { DYNAMIC_TENANTS } from './generated/tenants'
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

// Runtime tenant refresh configuration
type TenantData = Array<{ id: number; slug: string; customDomain: string | null }>
let runtimeTenants: TenantData | null = null
let lastRefresh = 0
const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes

async function getTenants(): Promise<TenantData> {
  const now = Date.now()

  // Use runtime cache if available and fresh
  if (runtimeTenants && now - lastRefresh < REFRESH_INTERVAL) {
    return runtimeTenants
  }

  // Try to refresh from ISR endpoint
  try {
    const baseUrl = getURL()
    const response = await fetch(`${baseUrl}/api/tenants-static`, {
      // Use no-cache to bypass any intermediate caches
      headers: { 'Cache-Control': 'no-cache' },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(3000), // 3 second timeout
    })

    if (response.ok) {
      const freshTenants = await response.json()
      // Validate that we got an array
      if (Array.isArray(freshTenants)) {
        runtimeTenants = freshTenants
        lastRefresh = now
        return runtimeTenants
      }
    }
  } catch (error) {
    console.warn(
      'Failed to refresh tenants from API, using build-time data:',
      error instanceof Error ? error.message : error,
    )
  }

  // Always fallback to build-time generated data (guaranteed to be an array)
  return [...DYNAMIC_TENANTS]
}

export default async function middleware(req: NextRequest) {
  const host = new URL(getURL()).host
  const requestedHost = req.headers.get('host')
  const isDraftMode = req.cookies.has('__prerender_bypass')
  const hasNextInPath = req.nextUrl.pathname.includes('/next/')
  const isSeedEndpoint = req.nextUrl.pathname.includes('/next/seed')

  // Get current tenants (with potential runtime refresh)
  const TENANTS = await getTenants()

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
          ? (tenant.customDomain ?? `${tenant.slug}.${host}`)
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
    for (const { id, slug, customDomain } of TENANTS) {
      const tenantDomain = customDomain ?? `${slug}.${host}`
      if (requestedHost === tenantDomain || requestedHost === `${slug}.${host}`) {
        const original = req.nextUrl.clone()
        original.host = requestedHost
        const rewrite = req.nextUrl.clone()

        if (req.nextUrl.pathname.startsWith('/admin')) {
          // Set tenant cookie to scope the admin panel to this domain's tenant
          const response = NextResponse.next()
          response.cookies.set('payload-tenant', id.toString(), {
            path: '/',
            sameSite: 'lax',
          })
          return response
        }

        rewrite.pathname = `/${slug}${rewrite.pathname}`
        console.log(`rewrote ${original.toString()} to ${rewrite.toString()}`)
        return NextResponse.rewrite(rewrite)
      }
    }
  }
}
