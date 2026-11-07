import { getCanonicalUrlForSlug } from '@/components/Header/utils'
import { ViewDocumentButton } from '@/components/ViewDocumentButton'
import { normalizePath } from '@/utilities/path'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import type { BeforeDocumentControlsServerProps } from 'payload'

// Pages missing from the nav still render at /<slug>. Nav URLs already start with '/'
// (/education/learn); the slug fallback doesn't.
const publicPageUrl = async (tenantSlug: string, slug: string) => {
  const url = (await getCanonicalUrlForSlug(tenantSlug, slug)) ?? slug
  return `/${tenantSlug}${normalizePath(url, { ensureLeadingSlash: true })}`
}

export const ViewPageButton = async (props: BeforeDocumentControlsServerProps) => {
  const { id, payload } = props

  if (!id) return null

  const page = await payload.findByID({ collection: 'pages', id, depth: 0, disableErrors: true })
  if (!page || page._status !== 'published') return null

  const pageTenant = await resolveTenant(page.tenant)
  return <ViewDocumentButton url={await publicPageUrl(pageTenant.slug, page.slug)} />
}
