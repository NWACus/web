/**
 * A record's own page, `/observations/<id>` and `/observations/avalanches/<id>`: native when the
 * center's observations flag is on, the widget's single-record view when it is off. Each page
 * renders its own breadcrumbs.
 */
import type { Metadata, ResolvedMetadata } from 'next/types'

import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { NativeObservationDetailPage } from '@/components/observations/NativeObservationDetailPage'
import type { ObservationKind } from '@/services/nac/model/observation'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { detailPath } from '@/services/nac/observations/routes'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { notFound } from 'next/navigation'

import SingleObservationPage from './SingleObservationPage'

export const RECORDS: Record<ObservationKind, { title: string; widgetRoute: string }> = {
  observation: { title: 'Field Observation', widgetRoute: '/observation' },
  avalanche: { title: 'Avalanche Occurrence', widgetRoute: '/avalanche' },
}

export async function ObservationRecordRoute({
  center,
  kind,
  id,
}: {
  center: string
  kind: ObservationKind
  id: string
}) {
  const platforms = await getAvalancheCenterPlatforms(center)
  if (!platforms.obs) notFound()

  const { title, widgetRoute } = RECORDS[kind]
  if (await getNativeProductFlag(center, 'observations')) {
    return <NativeObservationDetailPage center={center} kind={kind} id={id} />
  }
  return (
    <>
      <WidgetRouterHandler
        initialPath={`${widgetRoute}/${id}`}
        widgetPageKey="single-observation"
      />
      <SingleObservationPage title={title} center={center} />
    </>
  )
}

export async function recordMetadata(
  kind: ObservationKind,
  id: string,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const parentMeta = await parent
  const parentTitle =
    parentMeta.title && typeof parentMeta.title !== 'string' && 'absolute' in parentMeta.title
      ? parentMeta.title.absolute
      : parentMeta.title
  const title = `${RECORDS[kind].title} | ${parentTitle}`
  const path = detailPath(kind, id)
  return {
    title,
    alternates: { canonical: path },
    openGraph: { ...parentMeta.openGraph, title, url: path },
  }
}
