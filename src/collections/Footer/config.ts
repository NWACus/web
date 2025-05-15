import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import type { CollectionConfig } from 'payload'

export const Footer: CollectionConfig = {
  slug: 'footer',
  access: accessByTenant('footer'),
  admin: {
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    group: 'Globals',
    livePreview: {
      url: async ({ data, req, payload }) => {
        let tenant = data.tenant

        if (typeof tenant === 'number') {
          tenant = await payload.findByID({
            collection: 'tenants',
            id: tenant,
            depth: 2,
          })
        }

        const path = generatePreviewPath({
          slug: '',
          collection: 'pages',
          tenant,
          req,
        })

        return path
      },
    },
  },
  fields: [
    tenantField({ unique: true }),
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      // required: true,
      filterOptions: {
        mimeType: { contains: 'image' },
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      type: 'textarea',
    },
    {
      name: 'phone',
      type: 'text',
      // validate?
    },
    {
      name: 'email',
      type: 'email',
      // validate?
    },
    {
      name: 'socialMedia',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'instagram',
              type: 'text',
              admin: {
                width: '33%',
              },
            },
            {
              name: 'facebook',
              type: 'text',
              admin: {
                width: '33%',
              },
            },
            {
              name: 'twitter',
              type: 'text',
              admin: {
                width: '33%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'linkedin',
              type: 'text',
              admin: {
                width: '33%',
              },
            },
            {
              name: 'youtube',
              type: 'text',
              admin: {
                width: '33%',
              },
            },
          ],
        },
      ],
      admin: {
        description:
          'Add link to social media page to have the icon appear in the footer. Leave the field blank if you do not want the icon to show.',
      },
    },
    contentHashField(),
  ],
}
