import { NextRequest, NextResponse } from 'next/server'
import { getServerSideURL } from './utilities/getURL'

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
    '/((?!api|_next|_static|_vercel|media|thumbnail|[\\w-]+\\.\\w+).*)',
  ],
}

const TENANTS: { slug: string; domain: string; id: string }[] = [
  { slug: 'nwac', domain: 'nwac.us', id: '1' },
  { slug: 'sac', domain: 'sierraavalanchecenter.org', id: '2' },
  { slug: 'snfac', domain: 'sawtoothavalanche.com', id: '3' },
]

const REDIRECT_TO_CUSTOM_DOMAIN =
  process.env.REDIRECT_TO_CUSTOM_DOMAIN?.toLowerCase() === 'true' ||
  process.env.NODE_ENV === 'production'

export default async function middleware(req: NextRequest) {
  const host = new URL(getServerSideURL()).host
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
        redirectUrl.host = REDIRECT_TO_CUSTOM_DOMAIN ? tenant.domain : `${tenant.slug}.${host}`

        // Remove the tenant slug from the path for the redirect
        redirectUrl.pathname = `/${pathSegments.slice(1).join('/')}`

        console.log(`redirecting ${req.nextUrl.toString()} to ${redirectUrl.toString()}`)
        return NextResponse.redirect(redirectUrl, process.env.NODE_ENV === 'production' ? 308 : 302)
      }
    }
  }

  // If request is not to root domain
  if (host && requestedHost && !isSeedEndpoint) {
    for (const { id, slug, domain } of TENANTS) {
      if (requestedHost === `${domain}` || requestedHost === `${slug}.${host}`) {
        const original = req.nextUrl.clone()
        original.host = requestedHost
        const rewrite = req.nextUrl.clone()

        const existingPayloadTenantCookie = req.cookies.get('payload-tenant')?.value
        const hasCorrectPayloadTenantCookie = existingPayloadTenantCookie === id

        if (req.nextUrl.pathname.startsWith('/admin')) {
          if (hasCorrectPayloadTenantCookie) {
            return
          }

          const response = NextResponse.rewrite(rewrite)
          response.cookies.set('payload-tenant', id, {
            path: '/',
            expires: new Date('Fri, 31 Dec 9999 23:59:59 GMT'),
          })
          console.log(
            `rewrote ${original.toString()} to ${rewrite.toString()} with cookie payload-tenant=${id}`,
          )
          return response
        } else {
          rewrite.pathname = `/${slug}${rewrite.pathname}`
          console.log(`rewrote ${original.toString()} to ${rewrite.toString()}`)
          return NextResponse.rewrite(rewrite)
        }
      }
    }
  }
}
