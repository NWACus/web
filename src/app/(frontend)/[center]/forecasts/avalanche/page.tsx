import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { ForecastWidget } from '@/components/NACWidget/ForecastWidget'
import { AllZonesForecast } from '@/components/forecast/AllZonesForecast'
import {
  assertCenterPlatform,
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'
import { ZoneLinkHijacker } from './ZoneLinkHijacker.client'

// Static for the widget, as on `main`. The native grid reads each forecast through a 300s fetch,
// which lowers its render's window to 5 min; see "Rebuild cadence" in docs/afp-products/architecture.md.
export const revalidate = false

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params

  await assertCenterPlatform(center, 'forecasts')

  const useNative = await getNativeProductFlag(center, 'forecast')

  if (useNative) {
    return (
      <>
        <Breadcrumbs center={center} path="/forecasts/avalanche" />
        <AllZonesForecast centerSlug={center} />
      </>
    )
  }

  return (
    <ForecastWidget center={center} initialPath="/all/" widgetPageKey="forecasts">
      <ZoneLinkHijacker />
      <Breadcrumbs center={center} path="/forecasts/avalanche" />
    </ForecastWidget>
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
