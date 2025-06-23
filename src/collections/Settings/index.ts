import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig, TextFieldValidation } from 'payload'

const validateHashtag: TextFieldValidation = (value: string | null | undefined): string | true => {
  return value
    ? /^#[A-Za-z0-9_](?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}[A-Za-z0-9_]$/.test(value) ||
        `${value} is not a valid hashtag`
    : true
}

const validateTelephone: TextFieldValidation = (
  value: string | null | undefined,
): string | true => {
  return value
    ? /^(\+1\s?|1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value) ||
        `${value} is not a valid phone number`
    : true
}

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
            {
              name: 'address',
              type: 'textarea',
              admin: {
                placeholder: '200 Green Rose Lane, Suite 29\nPowder, USA 00000',
                description: 'Appears in your website footer.',
              },
            },
            {
              name: 'phone',
              type: 'text',
              validate: validateTelephone,
              admin: {
                description: 'Appears in your website footer.',
              },
            },
            {
              name: 'email',
              type: 'email',
              admin: {
                description: 'Appears in your website footer.',
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
        {
          label: 'Social Media',
          description:
            'Add links to your social media accounts to have the icon appear in the footer. Leave the field blank if you do not want the icon to show.',
          fields: [
            {
              name: 'socialMedia',
              label: '', // leaving blank intentionally since this is a single-group tab (group wanted for API response organization)
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
                      label: 'LinkedIn',
                      type: 'text',
                      admin: {
                        width: '33%',
                      },
                    },
                    {
                      name: 'youtube',
                      label: 'YouTube',
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
                      name: 'hashtag',
                      type: 'text',
                      validate: validateHashtag,
                      admin: {
                        description:
                          'A hashtag for users to mention you on social media platforms. This will appear in the footer if filled out.',
                        width: '33%',
                      },
                    },
                  ],
                },
              ],
              admin: {},
            },
          ],
        },
        {
          label: 'Legal Pages',
          description: 'Links to legal pages to be displayed in the footer.',
          fields: [
            {
              name: 'terms',
              label: 'Terms of Service',
              type: 'relationship',
              relationTo: 'pages',
            },
            {
              name: 'privacy',
              label: 'Privacy Policy',
              type: 'relationship',
              relationTo: 'pages',
            },
          ],
        },
      ],
    },
    contentHashField(),
  ],
}
