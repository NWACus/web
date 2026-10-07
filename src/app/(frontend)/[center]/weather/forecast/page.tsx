import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { NativeWeatherPage } from '@/components/forecast/NativeWeatherPage'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { ForecastPage } from '@/components/NWACWeather/ForecastPage'
import {
  assertCenterPlatform,
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { notFound } from 'next/navigation'

// Static for the widget, as on `main`. Both native pages read the current product through a 300s
// fetch, which lowers their render's window to 5 min; see "Rebuild cadence" in
// docs/afp-products/architecture.md.
export const revalidate = false

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params

  // NWAC's weather comes from products-api, not the widget, and its `platforms.weather` is false,
  // so its `weather` flag gates this page instead. Off, NWAC has no page, as before.
  if (center === 'nwac') {
    if (!(await getNativeProductFlag(center, 'weather'))) notFound()
    return (
      <>
        <Breadcrumbs center={center} path="/weather/forecast" />
        <ForecastPage centerSlug={center} />
      </>
    )
  }

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
