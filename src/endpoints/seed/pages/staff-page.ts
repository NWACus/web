import type { Media, Team, Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const staffPage: (
  tenant: Tenant,
  teams: Record<string, Team[]>,
  heroImage: Media,
  seoImage: Media,
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  teams: Record<string, Team[]>,
  heroImage: Media,
  seoImage: Media,
): RequiredDataFromCollectionSlug<'pages'> => {
  const slug = 'who-we-are'
  const title = 'Who We Are'
  const description = 'Meet our forecasters, non-profit staff and board of directors.'
  return {
    slug: slug,
    tenant: tenant,
    title: title,
    _status: 'published',
    hero: {
      type: 'lowImpact',
      richText: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              tag: 'h1',
              type: 'heading',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  mode: 'normal',
                  text: title,
                  type: 'text',
                  style: '',
                  detail: 0,
                  format: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  mode: 'normal',
                  text: description,
                  type: 'text',
                  style: '',
                  detail: 0,
                  format: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
              textStyle: '',
              textFormat: 0,
            },
          ],
          direction: 'ltr',
        },
      },
    },
    layout: teams[tenant.slug].map((team) => ({
      team: team,
      blockType: 'team',
    })),
    meta: {
      title: title,
      description: description,
      image: seoImage.id,
    },
  }
}
