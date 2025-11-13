import type { Media, Tenant } from '@/payload-types'
import { getURL } from '@/utilities/getURL'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const coursesByExternalProvidersPage: (
  tenant: Tenant,
  seoImage: Media,
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  seoImage: Media,
): RequiredDataFromCollectionSlug<'pages'> => {
  const url = getURL()

  return {
    slug: 'courses-by-external-providers',
    tenant: tenant.id,
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: [
      {
        richText: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                tag: 'h2',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: 'Providers',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: null,
                textFormat: 0,
                textStyle: '',
              },
            ],
            direction: null,
          },
        },
        backgroundColor: 'brand-400',
        wrapInContainer: true,
        blockName: null,
        blockType: 'headerBlock',
      },
      {
        html: `<iframe src="${url}/embeds/providers" height="300px" scrolling="true" width="100%" />`,
        backgroundColor: 'transparent',
        alignContent: 'left',
        blockName: null,
        blockType: 'genericEmbed',
      },
      {
        richText: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                tag: 'h2',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: 'Courses',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: null,
                textFormat: 0,
                textStyle: '',
              },
            ],
            direction: null,
          },
        },
        backgroundColor: 'brand-400',
        wrapInContainer: true,
        blockName: null,
        blockType: 'headerBlock',
      },
      {
        html: `<iframe src="${url}/embeds/courses?showFilters=true" height="800px" scrolling="true" width="100%" />`,
        backgroundColor: 'transparent',
        alignContent: 'left',
        blockName: null,
        blockType: 'genericEmbed',
      },
    ],
    meta: {
      description: 'Find avalanche education courses offered by external providers in your area.',
      image: seoImage.id,
    },
    title: 'Courses by External Providers',
  }
}
