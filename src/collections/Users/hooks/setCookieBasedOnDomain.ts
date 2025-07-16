import type { CollectionAfterLoginHook } from 'payload'

import { generateCookie, getCookieExpiration, mergeHeaders } from 'payload'

export const setCookieBasedOnDomain: CollectionAfterLoginHook = async ({ req, user }) => {
  const tenantForDomain = await req.payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1,
    where: {
      customDomain: {
        in: [req.headers.get('host')],
      },
    },
  })

  // If a matching tenant is found, set the 'payload-tenant' cookie
  if (tenantForDomain && tenantForDomain.docs.length > 0) {
    const tenantCookie = generateCookie({
      name: 'payload-tenant',
      expires: getCookieExpiration({ seconds: 7200 }),
      path: '/',
      returnCookieAsObject: false,
      value: tenantForDomain.docs[0].slug,
    })

    // Merge existing responseHeaders with the new Set-Cookie header
    const newHeaders = new Headers({
      'Set-Cookie': tenantCookie as string,
    })

    // Ensure you merge existing response headers if they already exist
    req.responseHeaders = req.responseHeaders
      ? mergeHeaders(req.responseHeaders, newHeaders)
      : newHeaders
  }

  return user
}
