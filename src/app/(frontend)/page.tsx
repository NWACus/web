import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-static'
export const revalidate = 600

export const metadata: Metadata = {
  title: 'AvyFx',
}

export default async function LandingPage() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    draft: false,
    limit: 1000,
    overrideAccess: true,
    select: {
      slug: true,
      name: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Avalanche Centers</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.docs.map((tenant) => (
              <Link
                key={tenant.slug}
                href={`/${tenant.slug}`}
                className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <h2 className="mb-2">{tenant.name}</h2>
                <p>View {tenant.name} center</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
