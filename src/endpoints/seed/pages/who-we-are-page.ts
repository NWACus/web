import type { Media, Team, Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const whoWeArePage: (
  tenant: Tenant,
  teams: Record<string, Team[]>,
  seoImage: Media,
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  teams: Record<string, Team[]>,
  seoImage: Media,
): RequiredDataFromCollectionSlug<'pages'> => {
  const slug = 'who-we-are'
  const title = 'Who We Are'
  const description = 'Meet our forecasters, non-profit staff and board of directors.'
  return {
    slug: slug,
    tenant: tenant.id,
    title: title,
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: teams[tenant.slug].map((team) => ({
      team: team.id,
      blockType: 'team',
    })),
    meta: {
      title: title,
      description: description,
      image: seoImage.id,
    },
  }
}
