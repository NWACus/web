import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetHashHandler } from '@/components/NACWidget/WidgetHashHandler.client'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { notFound } from 'next/navigation'
import { NACContainerRemover } from './NACContainerRemover.client'

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

  if (!avalancheCenterPlatforms.obs) {
    notFound()
  }

  const { version, baseUrl } = await getNACWidgetsConfig()

  return (
    <>
      <NACContainerRemover containerElementId="nac-obs-form-widget" />
      <WidgetHashHandler initialHash="form" />
      <div className="py-6 md:py-8 lg:py-12">
        <div className="container flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4 prose dark:prose-invert max-w-none">
            <h1>Submit Observation</h1>
          </div>
          <NACWidget
            center={center}
            widget={'observations'}
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
  const { center } = await params
  const tenant = await payload.find({
    collection: 'tenants',
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
      title: `Submit Observation`,
    }
  }
  return {
    title: `${tenant.docs[0].name} - Submit Observation`,
  }
}
