import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetHashHandler } from '@/components/NACWidget/WidgetHashHandler.client'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'
export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
    select: {
      slug: true,
    },
  })

  // TODO: hit the NAC API for forecast zones, translate active names to slugs

  return tenants.docs
    .filter((tenant) => typeof tenant.slug === 'string' && tenant.slug.trim() !== '')
    .map((tenant): PathArgs => ({ center: tenant.slug, zone: '' }))
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
  zone: string
}

export default async function Page({ params }: Args) {
  const { center, zone } = await params

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

  if (!avalancheCenterPlatforms.forecasts) {
    notFound()
  }

  const { version, baseUrl } = await getNACWidgetsConfig()

  return (
    <>
      <WidgetHashHandler initialHash={`/${zone}/`} />
      <div className="pt-4 pb-24">
        <div className="container flex flex-col">
          <NACWidget
            center={center}
            widget={'forecast'}
            widgetsVersion={version}
            widgetsBaseUrl={baseUrl}
          />
        </div>
      </div>
    </>
  )
}

export async function generateMetadata(
  { params }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = (await parent) as Metadata
  const { zone } = await params

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  const zoneName = zone
    .split('-')
    .map((word) => `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`)
    .join(' ')

  return {
    title: `${zoneName} - Avalanche Forecast | ${parentTitle}`,
    alternates: {
      canonical: `/forecasts/avalanche/${zone}`,
    },
    openGraph: {
      ...parentOg,
      title: `${zoneName} - Avalanche Forecast | ${parentTitle}`,
      url: `/forecasts/avalanche/${zone}`,
    },
  }
}
