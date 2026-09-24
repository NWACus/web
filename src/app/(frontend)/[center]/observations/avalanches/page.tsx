import type { Metadata, ResolvedMetadata } from 'next/types'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'

import {
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'

import { ObservationsTabRoute } from '../ObservationsTabRoute'

export const dynamic = 'force-static'

export const generateStaticParams = centerStaticParams

/**
 * The viewer's avalanches tab, at an address of its own. Native, it is the same viewer as
 * `/observations` opened on its other tab; on the widget, it opens the widget's own avalanches
 * view, which is what the address has always meant there as `#/view/avalanches`.
 */
export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params
  return (
    <>
      <Breadcrumbs center={center} path="/observations/avalanches" title="Avalanches" />
      <ObservationsTabRoute center={center} tab="avalanche" />
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
    label: 'Avalanches',
    path: '/observations/avalanches',
    center,
  })
}
