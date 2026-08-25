import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { MwfStackedView } from '@/components/mwf/MwfForecastView'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { createLocalPayloadMwfSource } from '@/services/products/mwf/source'
import { weatherForecastPageMode } from '@/utilities/mwf/weatherPageMode'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// One route, two data sources: centers with the MWF Settings flag render the
// natively-authored Mountain Weather Forecast straight from Payload (no
// cross-service hop); everyone else keeps the NAC widget behind the
// platforms.weather capability. ISR replaces the old force-static so the
// native forecast can't freeze at build time.
export const revalidate = 300

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 0,
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

  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: center } },
    limit: 1,
    depth: 0,
  })
  const tenant = tenants.docs[0]
  if (!tenant) notFound()

  const settings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
    depth: 0,
  })
  const mwfEnabled = Boolean(settings.docs[0]?.nativeProducts?.mwf)

  if (mwfEnabled) {
    const source = createLocalPayloadMwfSource(payload, tenant.id)
    const forecasts = await source.stackedForDate()
    return (
      <div className="container flex flex-col gap-6 pb-10">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="font-bold">Mountain Weather</h1>
        </div>
        <MwfStackedView forecasts={forecasts} />
        {forecasts.length > 0 && (
          <p className="text-sm">
            <Link
              className="underline"
              href={`/weather/forecast/archive/${forecasts[0].serviceDate}`}
            >
              Browse the forecast archive
            </Link>
          </p>
        )}
      </div>
    )
  }

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)
  if (
    weatherForecastPageMode({ mwfEnabled, platformsWeather: avalancheCenterPlatforms.weather }) !==
    'widget'
  ) {
    notFound()
  }

  return (
    <>
      <WidgetRouterHandler initialPath="/weather" widgetPageKey="weather-forecast" />
      <div className="flex flex-col gap-4">
        <div className="container mb-4">
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Mountain Weather</h1>
          </div>
        </div>
        <NACWidget center={center} widget={'forecast'} />
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
    title: `Mountain Weather | ${parentTitle}`,
    alternates: {
      canonical: '/weather/forecast',
    },
    openGraph: {
      ...parentOg,
      title: `Mountain Weather | ${parentTitle}`,
      url: '/weather/forecast',
      images: [
        { url: `/api/${center}/og?routeTitle=Mountain%20Weather`, width: 1200, height: 630 },
      ],
    },
  }
}
