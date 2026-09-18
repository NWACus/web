import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { NativeWeatherPage } from '@/components/forecast/NativeWeatherPage'
import {
  assertCenterPlatform,
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

// Short ISR backstop (5 min), matching the forecast routes: the native page renders the current
// weather product, so it must not be frozen at build time. The revalidate-on-view path catches a
// correction faster than this.
export const revalidate = 300

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params

  // The AFP's capability flag gates above our rollout flag: a center with no NAC weather product
  // (NWAC authors its own) has no Mountain Weather page whatever Settings says.
  await assertCenterPlatform(center, 'weather')

  const useNative = await getNativeProductFlag(center, 'weather')

  if (useNative) {
    return (
      <>
        <Breadcrumbs center={center} path="/weather/forecast" />
        <NativeWeatherPage centerSlug={center} />
      </>
    )
  }

  return (
    <>
      <WidgetRouterHandler initialPath="/weather" widgetPageKey="weather-forecast" />
      <Breadcrumbs center={center} path="/weather/forecast" />
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
