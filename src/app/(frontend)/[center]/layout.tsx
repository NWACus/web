import type { Metadata } from 'next'

import React from 'react'

import { Footer } from '@/components/Footer/Footer'
import { Header } from '@/components/Header/Header'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs.client'
import { PostHogTenantRegister } from '@/components/PostHogTenantRegister.client'
import { AvalancheCenterProvider } from '@/providers/AvalancheCenterProvider'
import { NotFoundProvider } from '@/providers/NotFoundProvider'
import { TenantProvider } from '@/providers/TenantProvider'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getMediaURL, getURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { cn } from '@/utilities/ui'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import invariant from 'tiny-invariant'
import './nac-widgets.css'
import ThemeSetter from './theme'

export const dynamicParams = false

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
    <NotFoundProvider>
      <TenantProvider tenant={tenant}>
        <PostHogTenantRegister />
        <AvalancheCenterProvider platforms={platforms} metadata={metadata}>
          <div className={cn('flex flex-col min-h-screen max-w-screen overflow-x-clip', center)}>
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
    </NotFoundProvider>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { center } = await params

  const settingsRes = await payload.find({
    collection: 'settings',
    depth: 1,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
    populate: {
      tenants: {
        slug: true,
        customDomain: true,
        name: true,
      },
    },
  })

  const settings = settingsRes.docs[0]
  const tenant = await resolveTenant(settings.tenant, {
    select: {
      name: true,
    },
  })

  const hostname = getHostnameFromTenant(tenant)
  const serverURL = getURL(hostname)

  let iconImgSrc

  if (settings.icon && typeof settings.icon !== 'number') {
    const cacheTag = settings.icon.updatedAt

    iconImgSrc = getMediaURL(
      settings.icon.sizes?.thumbnail?.url || settings.icon.url,
      cacheTag,
      getHostnameFromTenant(tenant),
    )
  }

  return {
    title: tenant ? tenant.name : 'Home',
    description: settings.description ?? `${tenant.name}'s website.`,
    metadataBase: new URL(serverURL),
    alternates: {
      canonical: serverURL,
    },
    ...(iconImgSrc
      ? {
          icons: iconImgSrc,
        }
      : {}),
    openGraph: mergeOpenGraph({
      title: tenant ? tenant.name : 'Home',
      description: settings.description ?? `${tenant.name}'s website.`,
      siteName: hostname,
      url: serverURL,
    }),
  }
}
