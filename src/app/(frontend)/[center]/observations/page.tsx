import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { Button } from '@/components/ui/button'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

  if (!avalancheCenterPlatforms.obs) {
    notFound()
  }

  const { version, baseUrl } = await getNACWidgetsConfig()

  return (
    <>
      <WidgetRouterHandler initialPath="/view/observations" widgetPageKey="recent-observations" />
      <div className="flex flex-col gap-4">
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Observations</h1>
            <Button asChild variant="secondary" className="no-underline">
              <Link href="/observations/submit">Submit Observation</Link>
            </Button>
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const parentMeta = (await parent) as Metadata

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Observations | ${parentTitle}`,
    alternates: {
      canonical: '/observations',
    },
    openGraph: {
      ...parentOg,
      title: `Observations | ${parentTitle}`,
      url: '/observations',
    },
  }
}
