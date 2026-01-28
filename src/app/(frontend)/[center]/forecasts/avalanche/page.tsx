import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { notFound } from 'next/navigation'
import { ZoneLinkHijacker } from './ZoneLinkHijacker.client'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
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
  const { center } = await params

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

  if (!avalancheCenterPlatforms.forecasts) {
    notFound()
  }

  const { version, baseUrl } = await getNACWidgetsConfig()

  return (
    <>
      <WidgetRouterHandler initialPath="/all/" widgetPageKey="forecasts" />
      <ZoneLinkHijacker />
      <div className="container flex flex-col">
        <NACWidget
          center={center}
          widget="forecast"
          widgetsVersion={version}
          widgetsBaseUrl={baseUrl}
        />
      </div>
    </>
  )
}

export async function generateMetadata(
  props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center } = await props.params
  const parentMeta = await parent

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Forecasts | ${parentTitle}`,
    alternates: {
      canonical: '/forecasts/avalanche',
    },
    openGraph: {
      ...parentOg,
      title: `Forecasts | ${parentTitle}`,
      url: '/forecasts/avalanche',
      images: [
        { url: `/api/${center}/og?routeTitle=Avalanche%20Forecast`, width: 1200, height: 630 },
      ],
    },
  }
}
