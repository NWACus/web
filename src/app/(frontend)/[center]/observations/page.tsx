import type { Metadata, ResolvedMetadata } from 'next/types'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'

import {
  centerRouteMetadata,
  centerStaticParams,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'

import { ObservationsTabRoute } from './ObservationsTabRoute'

export const dynamic = 'force-static'

export const generateStaticParams = centerStaticParams

export default async function Page({ params }: CenterRouteArgs) {
  const { center } = await params
  return (
    <>
      <Breadcrumbs center={center} path="/observations" />
      <ObservationsTabRoute center={center} tab="observation" />
    </>
  )
}

export async function generateMetadata(
  props: CenterRouteArgs,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center } = await props.params
  return centerRouteMetadata({ parent, label: 'Observations', path: '/observations', center })
}
