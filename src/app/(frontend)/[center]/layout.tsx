import type { Metadata } from 'next'

import React from 'react'

import { Announcements } from '@/components/Announcements/Announcements.client'
import { Footer } from '@/components/Footer/Footer'
import { Header } from '@/components/Header/Header'

import { PostHogCenterRegister } from '@/components/PostHogCenterRegister.client'
import { AvalancheCenterProvider } from '@/providers/AvalancheCenterProvider'
import { NACWidgetsConfigProvider } from '@/providers/NACWidgetsConfigProvider'
import { TenantProvider } from '@/providers/TenantProvider'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getCenterSettings } from '@/utilities/getCenterSettings'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { getMediaURL, getURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { cn } from '@/utilities/ui'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import invariant from 'tiny-invariant'
import './nac-widgets.css'
import ThemeSetter from './theme'

export const dynamicParams = true

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

  if (!isValidTenantSlug(center)) {
    notFound()
  }

  const settings = await getCenterSettings(center)

  if (!settings) {
    notFound()
  }

  const platforms = await getAvalancheCenterPlatforms(center)
  invariant(platforms, 'Could not determine avalanche center platforms')

  const metadata = await getAvalancheCenterMetadata(center)
  invariant(metadata, 'Could not determine avalanche center metadata')

  const nacWidgetsConfig = await getNACWidgetsConfig()

  return (
    <TenantProvider tenant={settings.tenant}>
      <PostHogCenterRegister />
      <AvalancheCenterProvider platforms={platforms} metadata={metadata}>
        <NACWidgetsConfigProvider config={nacWidgetsConfig}>
          <div className={cn('flex flex-col min-h-screen max-w-screen overflow-x-clip', center)}>
            <ThemeSetter theme={center} />
            <Announcements center={center}>
              <Header center={center} />
            </Announcements>
            <main className="flex-grow">{children}</main>
            <Footer center={center} />
          </div>
        </NACWidgetsConfigProvider>
      </AvalancheCenterProvider>
    </TenantProvider>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { center } = await params

  const settings = await getCenterSettings(center)
  if (!settings) {
    return {
      title: 'Not found',
    }
  }

  const { tenant } = settings
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
      images: [{ url: `/api/${center}/og`, width: 1200, height: 630 }],
    }),
  }
}
