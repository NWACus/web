import type { Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const globalPage: (
  title: string,
  slug: string,
  avyContentTenants?: Tenant[],
) => RequiredDataFromCollectionSlug<'globalPages'> = (
  title,
  slug,
  avyContentTenants = [],
): RequiredDataFromCollectionSlug<'globalPages'> => {
  return {
    slug,
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: [
      {
        backgroundColor: 'transparent',
        layout: '1_1',
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
                        text: `This is global content for the ${title} page, shared across all avalanche center sites.`,
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
    avyContent: avyContentTenants.map((tenant) => ({
      tenant: tenant.id,
      layout: [
        {
          backgroundColor: 'transparent',
          layout: '1_1',
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
                          text: `Center-specific content for ${tenant.name}.`,
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
    })),
    meta: {
      description: `${title} - shared across all avalanche centers.`,
    },
    title,
  }
}
