import Link from 'next/link'

import { ImageMedia } from '@/components/Media/ImageMedia'
import { Media, Tenant } from '@/payload-types'
import { getURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-static'

export default async function LandingPage() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload
    .find({
      collection: 'tenants',
      limit: 1000,
      where: {
        slug: {
          not_equals: 'dvac', // Filter out templated tenant
        },
      },
      sort: 'slug',
    })
    .then((result) => result.docs)

  const tenantIds = tenants.map((tenant) => tenant.id)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const tenantsLogo = (await payload
    .find({
      collection: 'settings',
      where: {
        tenant: {
          in: tenantIds,
        },
      },
      select: {
        logo: true,
        tenant: true,
      },
    })
    .then((result) => result.docs)) as { logo: Media; tenant: Tenant }[]

  return (
    <div className="py-12">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold">Avalanche Centers</h1>
            <Link href="/admin">Login</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {tenants.map(async (tenant) => {
              const hostname = getHostnameFromTenant(tenant)
              const href = getURL(hostname)
              const logo = tenantsLogo.find((logo) => logo.tenant.id === tenant.id)?.logo
              return (
                <Link
                  key={tenant.slug}
                  href={href}
                  className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition no-underline text-center"
                >
                  <div className="aspect-square flex items-center justify-center w-48 mx-auto">
                    <ImageMedia resource={logo} imgClassName="w-48" />
                  </div>
                  <div className="text-xl mt-4 font-semibold">{tenant.name} ➡️</div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
