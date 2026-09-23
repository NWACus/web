import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { NativeWeatherPage } from '@/components/forecast/NativeWeatherPage'
import { ForecastPage } from '@/components/weather/nwac/ForecastPage'
import { isNwacWeatherEnabled } from '@/services/nac/nac'
import {
  assertCenterWeather,
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

// One route, two native sources: NWAC's in-house Mountain Weather Forecast and the AFP weather
// product; the widget otherwise. Short ISR backstop (5 min), matching the forecast routes: the
// page renders the current issuance, so it must not be frozen at build time.
export const revalidate = 300

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params

  await assertCenterWeather(center)

  const [useNative, nwacWeather] = await Promise.all([
    getNativeProductFlag(center, 'weather'),
    isNwacWeatherEnabled(center),
  ])

  if (useNative && nwacWeather) {
    return (
      <>
        <Breadcrumbs center={center} path="/weather/forecast" />
        <div className="container py-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mountain Weather</h1>
        </div>
        <ForecastPage centerSlug={center} />
      </>
    )
  }

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
