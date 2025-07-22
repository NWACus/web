import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const revalidate = 300 // 5 minutes

// Cache the tenant fetching function with tags for revalidation
const getCachedTenants = unstable_cache(
  async () => {
    const payload = await getPayload({ config })

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

export async function GET() {
  try {
    const tenants = await getCachedTenants()

    return NextResponse.json(tenants, {
      headers: {
        // ISR: Cache for 5 minutes, then regenerate in background
        'Cache-Control': 's-maxage=300, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=300',
      },
    })
  } catch (error) {
    console.error('Error fetching tenants:', error)

    // Fallback to hardcoded tenants on error
    const fallbackTenants = [
      { id: 1, slug: 'nwac', customDomain: 'nwac.us' },
      { id: 2, slug: 'sac', customDomain: 'sierraavalanchecenter.org' },
      { id: 3, slug: 'snfac', customDomain: 'sawtoothavalanche.com' },
    ]

    return NextResponse.json(fallbackTenants, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  }
}
