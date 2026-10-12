import { ViewDocumentButton } from '@/components/ViewDocumentButton'
import { stationPagePath } from '@/services/stations/stationPages'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import type { BeforeDocumentControlsServerProps } from 'payload'

export const ViewStationPageButton = async (props: BeforeDocumentControlsServerProps) => {
  const { id, payload } = props

  if (!id) return null

  const pageRes = await payload.find({
    collection: 'stationPages',
    limit: 1,
    pagination: false,
    depth: 0,
    where: {
      id: {
        equals: id,
      },
    },
  })

  if (!pageRes.docs.length) return null

  const page = pageRes.docs[0]
  const pageTenant = await resolveTenant(page.tenant)

  return <ViewDocumentButton url={`/${pageTenant.slug}${stationPagePath(page.slug)}`} />
}
