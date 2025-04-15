import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { NACWidget } from '@/components/NACWidget'
import { draftMode } from 'next/headers'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    draft: false,
    limit: 1000,
    overrideAccess: true,
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant): PathArgs => ({ center: tenant.slug }))
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
}

export default async function Page({ params }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { center } = await params
  return (
    <div className="pt-24 pb-24">
      <PageClient />
      {draft && <LivePreviewListener />}
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none" id="nac-widget-container">
          <h1>Home Page for {center}</h1>
          <NACWidget center={center} widget={'map'} id="nac-widget-container" />
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { center } = await params
  const tenant = await payload.find({
    collection: 'tenants',
    overrideAccess: true,
    select: {
      name: true,
    },
    where: {
      slug: {
        equals: center,
      },
    },
  })
  if (tenant.docs.length < 1) {
    return {
      title: `Avalanche Center Homepage`,
    }
  }
  return {
    title: `${tenant.docs[0].name} - Homepage`,
  }
}
