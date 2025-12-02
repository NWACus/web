import type { Metadata, ResolvedMetadata } from 'next/types'

import { BreadcrumbSetter } from '@/components/Breadcrumbs/BreadcrumbSetter.client'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNACWidgetsConfig } from '@/utilities/getNACWidgetsConfig'
import { notFound } from 'next/navigation'
import SingleObservationPage from '../SingleObservationPage'

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
  id: string
}

export default async function Page({ params }: Args) {
  const { center, id } = await params

  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

  if (!avalancheCenterPlatforms.obs) {
    notFound()
  }

  const { version, baseUrl } = await getNACWidgetsConfig()

  return (
    <>
      <WidgetRouterHandler initialPath={`/observation/${id}`} widgetPageKey="single-observation" />
      <BreadcrumbSetter label="Field Observation" />
      <SingleObservationPage
        title="Field Observation"
        center={center}
        widgetsVersion={version}
        widgetsBaseUrl={baseUrl}
      />
    </>
  )
}

export async function generateMetadata(
  { params }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const parentMeta = (await parent) as Metadata

  const { id } = await params

  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title

  const parentOg = parentMeta.openGraph

  return {
    title: `Field Observation | ${parentTitle}`,
    alternates: {
      canonical: `/observations/${id}`,
    },
    openGraph: {
      ...parentOg,
      title: `Field Observation | ${parentTitle}`,
      url: `/observations/${id}`,
    },
  }
}
