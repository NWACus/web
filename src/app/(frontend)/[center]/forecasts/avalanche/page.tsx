import type { Metadata, ResolvedMetadata } from 'next/types'

import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'
import { AllZonesForecast } from '@/components/forecast/AllZonesForecast'
import {
  assertCenterPlatform,
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { ZoneLinkHijacker } from './ZoneLinkHijacker.client'

// Short ISR backstop (5 min) instead of force-static: bare force-static freezes the all-zones
// grid (per-zone danger + bottom line) at build time, which is unsafe for a daily forecast.
export const revalidate = 300

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params

  await assertCenterPlatform(center, 'forecasts')

  const useNative = await getNativeProductFlag(center, 'forecast')

  if (useNative) {
    return <AllZonesForecast centerSlug={center} />
  }

  return (
    <>
      <WidgetRouterHandler initialPath="/all/" widgetPageKey="forecasts" />
      <ZoneLinkHijacker />
      <div className="container flex flex-col">
        <NACWidget center={center} widget="forecast" />
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
    label: 'Forecasts',
    path: '/forecasts/avalanche',
    center,
    ogRouteTitle: 'Avalanche Forecast',
  })
}
