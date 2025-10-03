import { getCanonicalUrlForSlug } from '@/components/Header/utils'
import { ViewDocumentButton } from '@/components/ViewDocumentButton'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import type { BeforeDocumentControlsServerProps } from 'payload'

export const ViewPostButton = async (props: BeforeDocumentControlsServerProps) => {
  const { id, payload } = props
  const pageRes = await payload.find({
    collection: 'posts',
    limit: 1,
    pagination: false,
    depth: 2,
    where: {
      id: {
        equals: id,
      },
    },
  })
  const page = pageRes.docs[0]
  const pageTenant = await resolveTenant(page.tenant)
  const canonicalUrl = await getCanonicalUrlForSlug(pageTenant.slug, page.slug)
  if (!canonicalUrl) return null
  return <ViewDocumentButton url={`/${pageTenant.slug}/${canonicalUrl}`} />
}
