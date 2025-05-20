import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { notFound } from 'next/navigation'
import { ZoneHashHandler } from './ZoneHashHandler.client'

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

  // TODO: hit the NAC API for forecast zones, translate active names to slugs

  return tenants.docs.map((tenant): PathArgs => ({ center: tenant.slug, zone: '' }))
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
      <ZoneHashHandler zone={zone} />
      <div className="py-6 md:py-8 lg:py-12">
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

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { center, zone } = await params
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
      title: `Avalanche Forecasts`,
    }
  }
  // TODO: translate zone slug to zone name
  return {
    title: `${tenant.docs[0].name} - ${zone} Avalanche Forecast`,
  }
}
