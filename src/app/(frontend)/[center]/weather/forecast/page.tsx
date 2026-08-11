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

  await assertCenterPlatform(center, 'weather')

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
  props: CenterRouteArgs,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center } = await props.params

  return centerRouteMetadata({
    parent,
    label: 'Mountain Weather',
    path: '/weather/forecast',
    center,
  })
}
