import type { Metadata, ResolvedMetadata } from 'next/types'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'

import {
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'

import { ObservationsTabRoute } from '../ObservationsTabRoute'

export const dynamic = 'force-static'
// The native viewer bakes in the obs zones; rebuilt hourly to pick up changes or a failed fetch.
export const revalidate = 3600 // Next.js requires a static literal here

export const generateStaticParams = centerStaticParams

/**
 * The viewer's charts tab, at an address of its own: the same viewer as `/observations` opened on
 * its third tab, which charts the avalanches in the map area. On the widget it opens the widget's
 * own "Visual" view, which the address has always meant there as `#/view/visual`.
 */
export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params
  return (
    <>
      <Breadcrumbs center={center} path="/observations/charts" title="Charts" />
      <ObservationsTabRoute center={center} tab="charts" />
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
    label: 'Charts',
    path: '/observations/charts',
    center,
  })
}
