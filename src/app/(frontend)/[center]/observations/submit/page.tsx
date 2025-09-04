import type { Metadata, ResolvedMetadata } from 'next/types'

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
      <div className="pt-4 pb-24">
        <div className="container flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4 prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Submit Observation</h1>
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
    title: `Submit Observation | ${parentTitle}`,
    alternates: {
      canonical: '/observations/submit',
    },
    openGraph: {
      ...parentOg,
      title: `Submit Observation | ${parentTitle}`,
      url: '/observations/submit',
    },
  }
}
