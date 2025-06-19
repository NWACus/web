import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

export const Settings: CollectionConfig = {
  slug: 'settings',
  access: accessByTenant('settings'),
  labels: {
    singular: 'Website Settings',
    plural: 'Website Settings',
  },
  admin: {
    baseListFilter: filterByTenant,
    group: 'Settings',
  },
  fields: [
    tenantField({ unique: true }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              type: 'ui',
              name: 'avalancheCenterName',
              admin: {
                components: {
                  Field:
                    '@/collections/Settings/components/AvalancheCenterName#AvalancheCenterName',
                },
              },
            },
            {
              name: 'description',
              type: 'text',
              admin: {
                description:
                  'A short description of your avalanche center. This will be used in meta tags for search engine optimization and display in previews on social media and in messaging apps.',
              },
            },
          ],
        },
        {
          label: 'Brand Assets',
          description:
            'Images used throughout the website including in the header, footer, browser tabs, and link previews.',
          fields: [
            {
              name: 'logo',
              label: 'Logo',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: { contains: 'image' },
              },
              admin: {
                description: 'Should be a square aspect ratio image.',
              },
              required: true,
            },
            {
              name: 'icon',
              label: 'Icon',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: { contains: 'image' },
              },
              admin: {
                description:
                  'Should be a compressed, 96x96 pixel, square aspect ratio image. This will be used as the browser tab icon.',
              },
              required: true,
            },
            {
              name: 'banner',
              label: 'Banner Logo',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: { contains: 'image' },
              },
              admin: {
                description:
                  'This will be used in the header of your website next to the USFS logo if added.',
              },
              required: true,
            },
            {
              name: 'usfsLogo',
              label: 'USFS Logo',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: { contains: 'image' },
              },
              admin: {
                components: {
                  Description:
                    '@/collections/Settings/components/USFSLogoDescription#USFSLogoDescription',
                },
              },
            },
          ],
        },
      ],
    },
    contentHashField(),
  ],
}
