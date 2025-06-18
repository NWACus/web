import Link from 'next/link'

import { getHostnameFromTenant } from '@/utilities/getHostnameFromTenant'
import { getURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function LandingPage() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <div className="flex justify-between items-center">
            <h1>Avalanche Centers</h1>
            <Link href="/admin">Login</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.docs.map(async (tenant) => (
              <Link
                key={tenant.slug}
                href={getURL(getHostnameFromTenant(tenant))}
                className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <h2 className="mb-2">{tenant.name}</h2>
                <p className="no-underline">Visit site ➡️</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
