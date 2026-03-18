import { ViewDocumentButton } from '@/components/ViewDocumentButton'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import type { BeforeDocumentControlsServerProps } from 'payload'

export const ViewPostButton = async (props: BeforeDocumentControlsServerProps) => {
  const { id, payload } = props

  if (!id) return null

  const postRes = await payload.find({
    collection: 'posts',
    limit: 1,
    pagination: false,
    depth: 0,
    where: {
      id: {
        equals: id,
      },
    },
  })

  if (!postRes.docs.length) return null

  const post = postRes.docs[0]

  if (post._status !== 'published') return null

  const postTenant = await resolveTenant(post.tenant)

  return <ViewDocumentButton url={`/${postTenant.slug}/blog/${post.slug}`} />
}
