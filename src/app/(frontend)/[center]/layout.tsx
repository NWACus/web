import type { Metadata } from 'next'

import React from 'react'

import { Footer } from '@/Footer/Component'
import { Header } from '@/components/Header/Header'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { AvalancheCenterProvider } from '@/providers/AvalancheCenter'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getServerSideURL } from '@/utilities/getURL'
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
    draft: false,
    limit: 1000,
    overrideAccess: true,
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

  const platforms = await getAvalancheCenterPlatforms(center)
  invariant(platforms, 'Could not determine avalanche center platforms')

  const metadata = await getAvalancheCenterMetadata(center)
  invariant(metadata, 'Could not determine avalanche center metadata')

  return (
    <AvalancheCenterProvider platforms={platforms} metadata={metadata}>
      <div className={cn('flex flex-col min-h-screen', center)}>
        <ThemeSetter theme={center} />
        <Header center={center} />
        <main className="flex-grow">{children}</main>
        <Footer center={center} />
      </div>
    </AvalancheCenterProvider>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
