import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import type { CollectionConfig, TextFieldValidation } from 'payload'

const validateHashtag: TextFieldValidation = (value: string | null | undefined): string | true => {
  if (value === null || value === undefined) return true
  else
    return (
      value?.match(/^#[A-Za-z0-9_](?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}[A-Za-z0-9_]$/)?.length ===
        1 || `${value} is not a valid hashtag`
    )
}

const validateTelephone: TextFieldValidation = (
  value: string | null | undefined,
): string | true => {
  console.log(value?.match(/^(\+1\s?|1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/))
  if (value === null || value === undefined) return true
  else
    return (
      value?.match(/^(\+1\s?|1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/g)?.length === 1 ||
      `${value} is not a valid hashtag`
    )
}

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
      validate: validateTelephone,
    },
    {
      name: 'email',
      type: 'email',
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
    {
      name: 'hashtag',
      type: 'text',
      validate: validateHashtag,
    },
    contentHashField(),
  ],
}
