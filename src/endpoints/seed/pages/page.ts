import type { Media, Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const page: (
  tenant: Tenant,
  seoImage: Media,
  title: string,
  description: string,
  slug: string,
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  seoImage: Media,
  title: string,
  description: string,
  slug: string,
): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: slug,
    tenant: tenant.id,
    _status: 'published',
    layout: [
      {
        backgroundColor: 'white',
        columns: [
          {
            richText: {
              root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'paragraph',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        mode: 'normal',
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
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
        ],
        blockType: 'content',
      },
    ],
    meta: {
      description: description,
      image: seoImage.id,
      title: title,
    },
    title: title,
  }
}
