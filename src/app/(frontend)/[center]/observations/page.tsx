import type { Metadata, ResolvedMetadata } from 'next/types'

import { ButtonLink } from '@/components/ButtonLink'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import {
  assertCenterPlatform,
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'
import { ObservationLinkHijacker } from './ObservationLinkHijacker.client'

export const dynamic = 'force-static'

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params

  await assertCenterPlatform(center, 'obs')

  return (
    <>
      <WidgetRouterHandler initialPath="/view/observations" widgetPageKey="recent-observations" />
      <ObservationLinkHijacker />
      <div className="flex flex-col gap-4">
        <div className="container flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Observations</h1>
            <ButtonLink href="/observations/submit" variant="secondary">
              Submit Observation
            </ButtonLink>
          </div>
          <ObservationsDisclaimer />
        </div>
        <NACWidget center={center} widget={'observations'} />
      </div>
    </>
  )
}

export async function generateMetadata(
  props: CenterRouteArgs,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center } = await props.params

  return centerRouteMetadata({
    parent,
    label: 'Observations',
    path: '/observations',
    center,
  })
}
