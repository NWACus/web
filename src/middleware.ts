import { STATIC_TENANTS } from '@/generated/tenants'
import { NextRequest, NextResponse } from 'next/server'
import { getURL } from './utilities/getURL'
import { PRODUCTION_TENANTS } from './utilities/tenancy/tenants'

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

type TenantData = Array<{ id: number; slug: string; customDomain: string | null }>

async function getTenants(): Promise<{
  tenants: TenantData
  source: 'api' | 'fallback'
  duration: number
}> {
  const start = performance.now()

  try {
    const baseUrl = getURL()
    const response = await fetch(`${baseUrl}/api/tenants/cached-public`, {
      signal: AbortSignal.timeout(500), // 500 ms timeout to keep max middleware execution time low
    })

    if (response.ok) {
      const freshTenants = await response.json()

      if (Array.isArray(freshTenants)) {
        const duration = performance.now() - start
        return { tenants: freshTenants, source: 'api', duration }
      }
    }
  } catch (error) {
    console.warn(
      'Failed to refresh tenants from API, using build-time data:',
      error instanceof Error ? error.message : error,
    )
  }

  // Fallback to build-time generated data
  const duration = performance.now() - start
  return { tenants: [...STATIC_TENANTS], source: 'fallback', duration }
}

export default async function middleware(req: NextRequest) {
  const middlewareStart = performance.now()

  const logCompletion = (action: string) => {
    const totalDuration = performance.now() - middlewareStart
    console.log(
      `[Middleware] ${action}: ${totalDuration.toFixed(2)}ms total - ${req.nextUrl.pathname}`,
    )
  }

  const host = new URL(getURL()).host
  const requestedHost = req.headers.get('host')
  const isDraftMode = req.cookies.has('__prerender_bypass')
  const hasNextInPath = req.nextUrl.pathname.includes('/next/')
  const isSeedEndpoint = req.nextUrl.pathname.includes('/next/seed')

  const { tenants: TENANTS, source, duration: getTenantsDuration } = await getTenants()

  console.log(
    `[Middleware] getTenants: ${getTenantsDuration.toFixed(2)}ms (${source}) - ${req.nextUrl.pathname}`,
  )

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

        // For production tenants: use custom domain if available, otherwise fall back to subdomain
        // For non-production tenants: always use subdomain
        if (PRODUCTION_TENANTS.includes(tenant.slug)) {
          if (tenant.customDomain) {
            redirectUrl.host = tenant.customDomain
          } else {
            console.error(
              `Production tenant "${tenant.slug}" is missing a custom domain. Falling back to subdomain.`,
            )
            redirectUrl.host = `${tenant.slug}.${host}`
          }
        } else {
          redirectUrl.host = `${tenant.slug}.${host}`
        }

        // Remove the tenant slug from the path for the redirect
        redirectUrl.pathname = `/${pathSegments.slice(1).join('/')}`

        console.log(`redirecting ${req.nextUrl.toString()} to ${redirectUrl.toString()}`)
        logCompletion('redirect')
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
          // Set tenant cookie to scope the admin panel to this domain's tenant if not already set
          const existingPayloadTenantCookie = req.cookies.get('payload-tenant')

          if (existingPayloadTenantCookie?.value !== id.toString()) {
            const response = NextResponse.next()
            response.cookies.set('payload-tenant', id.toString(), {
              path: '/',
              sameSite: 'lax',
            })
            logCompletion('admin-cookie-set')
            return response
          }

          logCompletion('admin-passthrough')
          return
        }

        rewrite.pathname = `/${slug}${rewrite.pathname}`
        console.log(`rewrote ${original.toString()} to ${rewrite.toString()}`)
        logCompletion('rewrite')
        return NextResponse.rewrite(rewrite)
      }
    }
  }

  logCompletion('passthrough')
}
