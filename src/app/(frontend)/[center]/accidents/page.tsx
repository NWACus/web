import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetHashHandler } from '@/components/NACWidget/WidgetHashHandler.client'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant): PathArgs => ({ center: tenant.slug }))
}

type Args = {
  params: Promise<PathArgs>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

type PathArgs = {
  center: string
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params
  const search = await searchParams

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

  if (!avalancheCenterPlatforms.obs) {
    notFound()
  }

  const { version, baseUrl } = await getNACWidgetsConfig()

  const queryParams = new URLSearchParams()

  Object.entries(search).forEach(([key, value]) => {
    if (value !== undefined) {
      const stringValue = Array.isArray(value) ? value[0] : value
      const decodedValue = decodeURIComponent(stringValue)
      queryParams.set(key, decodedValue)
    }
  })

  const queryString = queryParams.toString()
  const initialHash = `/view/avalanches${queryString ? `?${queryString}` : ''}`
  const cleanUrl = queryString ? `/accidents` : undefined

  return (
    <>
      <WidgetHashHandler initialHash={initialHash} cleanUrl={cleanUrl} />
      <div className="flex flex-col gap-4">
        <div className="container">
          <div className="flex justify-between items-center gap-4 prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Accidents</h1>
          </div>
        </div>
        <NACWidget
          center={center}
          widget={'observations'}
          widgetsVersion={version}
          widgetsBaseUrl={baseUrl}
        />
      </div>
    </>
  )
}

export async function generateMetadata(
  _props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Accidents | ${parentTitle}`,
    alternates: {
      canonical: '/accidents',
    },
    openGraph: {
      ...parentOg,
      title: `Accidents | ${parentTitle}`,
      url: '/accidents',
    },
  }
}
