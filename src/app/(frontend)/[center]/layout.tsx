import type { Metadata } from 'next'

import React from 'react'

import { Footer } from '@/components/Footer/Footer'
import { Header } from '@/components/Header/Header'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs.client'
import { PostHogTenantRegister } from '@/components/PostHogTenantRegister.client'
import { AvalancheCenterProvider } from '@/providers/AvalancheCenterProvider'
import { TenantProvider } from '@/providers/TenantProvider'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getURL } from '@/utilities/getURL'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { cn } from '@/utilities/ui'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import invariant from 'tiny-invariant'
import './nac-widgets.css'
import ThemeSetter from './theme'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant) => ({ center: tenant.slug }))
}

type Args = {
  children: React.ReactNode
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
}

export default async function RootLayout({ children, params }: Args) {
  const { center } = await params

  const payload = await getPayload({ config: configPromise })
  const tenantsRes = await payload.find({
    collection: 'tenants',
    where: {
      slug: {
        equals: center,
      },
    },
  })
  const tenant = tenantsRes.docs.length >= 1 ? tenantsRes.docs[0] : null
  invariant(tenant, `Could not determine tenant for center value: ${center}`)

  const platforms = await getAvalancheCenterPlatforms(center)
  invariant(platforms, 'Could not determine avalanche center platforms')

  const metadata = await getAvalancheCenterMetadata(center)
  invariant(metadata, 'Could not determine avalanche center metadata')

  return (
    <TenantProvider tenant={tenant}>
      <PostHogTenantRegister />
      <AvalancheCenterProvider platforms={platforms} metadata={metadata}>
        <div className={cn('flex flex-col min-h-screen', center)}>
          <ThemeSetter theme={center} />
          <Header center={center} />
          <main className="flex-grow">
            <Breadcrumbs />
            {children}
          </main>
          <Footer center={center} />
        </div>
      </AvalancheCenterProvider>
    </TenantProvider>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { center } = await params
  const tenantsRes = await payload.find({
    collection: 'tenants',
    where: {
      slug: {
        equals: center,
      },
    },
  })

  const tenant = tenantsRes.docs.length > 1 ? tenantsRes.docs[0] : null

  if (!tenant) {
    return {
      metadataBase: new URL(getURL()),
      openGraph: mergeOpenGraph(),
      twitter: {
        card: 'summary_large_image',
      },
    }
  }

  const hostname = getHostnameFromTenant(tenant)

  const websiteSettingsRes = await payload.find({
    collection: 'settings',
    where: {
      'tenant.slug': {
        equals: tenant.slug,
      },
    },
  })
  const websiteSettings = websiteSettingsRes.docs.length > 1 ? websiteSettingsRes.docs[0] : null

  const title = tenant.name
  const description = websiteSettings?.description || `${tenant.name}'s website.`

  return {
    title,
    description,
    metadataBase: new URL(getURL(hostname)),
    openGraph: mergeOpenGraph({
      title,
      description,
    }),
    twitter: {
      card: 'summary_large_image',
    },
  }
}
