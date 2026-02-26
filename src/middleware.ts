import { NextRequest, NextResponse } from 'next/server'
import { getURL } from './utilities/getURL'
import {
  findCenterByDomain,
  isValidTenantSlug,
  ValidTenantSlug,
} from './utilities/tenancy/avalancheCenters'
import { getProductionCustomDomain, isProductionTenant } from './utilities/tenancy/tenants'

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /ingest (PostHog analytics proxy)
     * 3. /_next (Next.js internals)
     * 4. /_static (inside /public)
     * 5. all root files inside /public (e.g. /favicon.ico)
     * 6. /media, /thumbnail, /assets (inside /public)
     * 7. sitemap.xml, robots.txt, pages-sitemap.xml, posts-sitemap.xml
     */
    '/((?!api|ingest|_next|_static|_vercel|[\\w-]+\\.\\w+|media|thumbnail|assets).*)',
    '/sitemap.xml',
    '/robots.txt',
    '/pages-sitemap.xml',
    '/posts-sitemap.xml',
  ],
}

/**
 * Sets the payload-tenant cookie if needed and returns whether it was set.
 * Cookie stores the tenant slug.
 */
function setCookieIfNeeded(
  response: NextResponse,
  slug: ValidTenantSlug,
  existingCookie: string | undefined,
): boolean {
  if (existingCookie !== slug) {
    response.cookies.set('payload-tenant', slug, {
      path: '/',
      sameSite: 'lax',
    })
    return true
  }
  return false
}

export default function middleware(req: NextRequest) {
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
  const existingCookieValue = req.cookies.get('payload-tenant')?.value

  // If request is to a custom domain (not the root domain and not a subdomain of root)
  if (host && requestedHost && requestedHost !== host && !requestedHost.includes(`.${host}`)) {
    // Look up tenant by custom domain from hardcoded list
    const tenantSlug = findCenterByDomain(requestedHost)

    if (tenantSlug && isProductionTenant(tenantSlug) && !hasNextInPath) {
      const pathname = req.nextUrl.pathname

      if (pathname.startsWith('/admin')) {
        const response = NextResponse.next()
        if (setCookieIfNeeded(response, tenantSlug, existingCookieValue)) {
          logCompletion('custom-domain-admin-cookie-set')
          return response
        }

        logCompletion('custom-domain-admin-passthrough')
        return
      }

      const rewrite = req.nextUrl.clone()
      rewrite.pathname = `/${tenantSlug}${rewrite.pathname}`
      console.log(`rewrote custom domain ${req.nextUrl.toString()} to ${rewrite.toString()}`)

      const response = NextResponse.rewrite(rewrite)
      if (setCookieIfNeeded(response, tenantSlug, existingCookieValue)) {
        logCompletion('custom-domain-rewrite-with-cookie')
        return response
      }

      logCompletion('custom-domain-rewrite')
      return NextResponse.rewrite(rewrite)
    }
  }

  // If request is to root domain with tenant in path
  if (host && requestedHost && requestedHost === host) {
    const pathSegments = req.nextUrl.pathname.split('/').filter(Boolean)

    // Check if the first path segment matches a valid tenant slug
    if (pathSegments.length > 0) {
      const potentialTenant = pathSegments[0]

      if (isValidTenantSlug(potentialTenant) && !isDraftMode && !hasNextInPath) {
        // Redirect to the tenant's subdomain or custom domain
        const redirectUrl = new URL(req.nextUrl.clone())

        // For production tenants: use custom domain if available, otherwise fall back to subdomain
        // For non-production tenants: always use subdomain
        const customDomain = getProductionCustomDomain(potentialTenant)
        if (customDomain) {
          redirectUrl.host = customDomain
        } else {
          if (isProductionTenant(potentialTenant)) {
            console.error(
              `Production tenant "${potentialTenant}" is missing a custom domain. Falling back to subdomain.`,
            )
          }
          redirectUrl.host = `${potentialTenant}.${host}`
        }

        // Remove the tenant slug from the path for the redirect
        redirectUrl.pathname = `/${pathSegments.slice(1).join('/')}`

        console.log(`redirecting ${req.nextUrl.toString()} to ${redirectUrl.toString()}`)
        logCompletion('redirect')
        return NextResponse.redirect(redirectUrl, process.env.NODE_ENV === 'production' ? 308 : 302)
      }
    }
  }

  // If request is to subdomain on root domain
  if (host && requestedHost && !isSeedEndpoint) {
    // Extract subdomain: remove the root domain suffix - pattern: slug.host
    const subdomainMatch = requestedHost.match(
      new RegExp(`^([^.]+)\\.${host.replace('.', '\\.')}$`),
    )
    const subdomain = subdomainMatch?.[1]

    if (subdomain && isValidTenantSlug(subdomain)) {
      const slug = subdomain
      const customDomain = getProductionCustomDomain(slug)

      // Redirect to custom domain if tenant is a production tenant and has a custom domain configured
      if (customDomain) {
        const redirectUrl = new URL(req.nextUrl.clone())
        redirectUrl.host = customDomain

        console.log(`redirecting ${req.nextUrl.toString()} to ${redirectUrl.toString()}`)
        logCompletion('custom-domain-redirect')
        return NextResponse.redirect(redirectUrl, process.env.NODE_ENV === 'production' ? 308 : 302)
      }

      if (req.nextUrl.pathname.startsWith('/admin')) {
        const response = NextResponse.next()
        if (setCookieIfNeeded(response, slug, existingCookieValue)) {
          logCompletion('admin-cookie-set')
          return response
        }

        logCompletion('admin-passthrough')
        return
      }

      const original = req.nextUrl.clone()
      original.host = requestedHost
      const rewrite = req.nextUrl.clone()
      rewrite.pathname = `/${slug}${rewrite.pathname}`
      console.log(`rewrote ${original.toString()} to ${rewrite.toString()}`)

      const response = NextResponse.rewrite(rewrite)
      if (setCookieIfNeeded(response, slug, existingCookieValue)) {
        logCompletion('rewrite-with-cookie')
        return response
      }

      logCompletion('rewrite')
      return NextResponse.rewrite(rewrite)
    }
  }

  logCompletion('passthrough')
}
