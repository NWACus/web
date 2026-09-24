import type { Metadata, ResolvedMetadata } from 'next/types'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { detailPath } from '@/services/nac/observations/routes'

import { ObservationRecordRoute, RECORDS, recordMetadata } from '../ObservationRecordRoute'

type Args = {
  params: Promise<{ center: string; id: string }>
}

export default async function Page({ params }: Args) {
  const { center, id } = await params
  return (
    <>
      <Breadcrumbs
        center={center}
        path={detailPath('observation', id)}
        title={RECORDS.observation.title}
      />
      <ObservationRecordRoute center={center} kind="observation" id={id} />
    </>
  )
}

export async function generateMetadata(
  { params }: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { id } = await params
  return recordMetadata('observation', id, parent)
}
