import { getCanonicalUrlForSlug } from '@/components/Header/utils'
import { ViewDocumentButton } from '@/components/ViewDocumentButton'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import type { BeforeDocumentControlsServerProps } from 'payload'

export const ViewPageButton = async (props: BeforeDocumentControlsServerProps) => {
  const { id, payload } = props

  if (!id) return null

  const pageRes = await payload.find({
    collection: 'pages',
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
  if (page._status !== 'published') return null

  // Pages missing from the nav still render at /<slug>
  const url = (await getCanonicalUrlForSlug(pageTenant.slug, page.slug)) ?? page.slug

  return <ViewDocumentButton url={`/${pageTenant.slug}/${url}`} />
}
