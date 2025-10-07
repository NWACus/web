import { getCanonicalUrlForSlug } from '@/components/Header/utils'
import { ViewDocumentButton } from '@/components/ViewDocumentButton'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import type { BeforeDocumentControlsServerProps } from 'payload'

export const ViewPostButton = async (props: BeforeDocumentControlsServerProps) => {
  const { id, payload } = props
  const postRes = await payload.find({
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
  const post = postRes.docs[0]
  const postTenant = await resolveTenant(post.tenant)
  const canonicalUrl = await getCanonicalUrlForSlug(postTenant.slug, post.slug)
  if (!canonicalUrl || post._status !== 'published') return null
  return <ViewDocumentButton url={`/${postTenant.slug}/${canonicalUrl}`} />
}
