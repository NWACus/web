import type { Metadata, ResolvedMetadata } from 'next/types'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import {
  assertCenterPlatform,
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'

export const dynamic = 'force-static'

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params

  await assertCenterPlatform(center, 'obs')

  return (
    <>
      <WidgetRouterHandler initialPath="/form" widgetPageKey="submit-observation" />
      <div className="container flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center gap-4 prose dark:prose-invert max-w-none">
            <h1 className="font-bold">Submit Observation</h1>
          </div>
        </div>
        <NACWidget center={center} widget={'observations'} />
      </div>
    </>
  )
}

export async function generateMetadata(
  _props: CenterRouteArgs,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  return centerRouteMetadata({
    parent,
    label: 'Submit Observation',
    path: '/observations/submit',
  })
}
