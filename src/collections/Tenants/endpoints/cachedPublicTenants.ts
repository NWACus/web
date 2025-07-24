import { STATIC_TENANTS } from '@/generated'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

const getCachedTenants = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    const tenantsRes = await payload.find({
      collection: 'tenants',
      limit: 1000,
      pagination: false,
      select: {
        id: true,
        slug: true,
        customDomain: true,
      },
    })

    return tenantsRes.docs.map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      customDomain: tenant.customDomain || null,
    }))
  },
  ['tenants-data'],
  {
    tags: ['tenants'],
    revalidate: 300, // 5 minutes
  },
)

export const cachedPublicTenants = async (): Promise<Response> => {
  try {
    const tenants = await getCachedTenants()

    return Response.json(tenants, {
      headers: {
        // ISR: Cache for 5 minutes, then regenerate in background
        'Cache-Control': 's-maxage=300, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=300',
      },
    })
  } catch (error) {
    console.error('Error fetching tenants:', error)

    // Fallback to build-time generated data
    return Response.json([...STATIC_TENANTS], {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  }
}
