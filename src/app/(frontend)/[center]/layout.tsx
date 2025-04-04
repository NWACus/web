import type { Metadata } from 'next'

import '../globals.css'
import React from 'react'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { getServerSideURL } from '@/utilities/getURL'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

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

  return (
    <React.Fragment>
      <Header center={center} />
      {children}
      <Footer center={center} />
    </React.Fragment>
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
