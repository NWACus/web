import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { CollectionConfig, Field, TextFieldValidation } from 'payload'
import { revalidateSettings } from './hooks/revalidateSettings'

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

const generalFields: Field[] = [
  {
    type: 'ui',
    name: 'avalancheCenterName',
    admin: {
      components: {
        Field: '@/collections/Settings/components/AvalancheCenterName#AvalancheCenterName',
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
    name: 'phoneLabel',
    type: 'select',
    options: [
      { label: 'Phone', value: 'phone' },
      { label: 'Office', value: 'office' },
      { label: 'Text', value: 'text' },
      { label: 'Call', value: 'call' },
    ],
    admin: {
      description: 'Optional label for phone in your website footer.',
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
    name: 'phoneSecondaryLabel',
    type: 'select',
    options: [
      { label: 'Phone', value: 'phone' },
      { label: 'Office', value: 'office' },
      { label: 'Text', value: 'text' },
      { label: 'Call', value: 'call' },
    ],
    admin: {
      description: 'Optional label for secondary phone in your website footer.',
    },
  },
  {
    name: 'phoneSecondary',
    type: 'text',
    validate: validateTelephone,
    admin: {
      description: 'Secondary phone appears in your website footer.',
    },
  },
  {
    name: 'email',
    type: 'email',
    admin: {
      description: 'Appears in your website footer.',
    },
  },
]

const footerForm: Field[] = [
  {
    name: 'footerForm',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      { name: 'title', type: 'text' },
      { name: 'subtitle', type: 'text' },
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            required: true,
            type: 'radio',
            label: 'What type of subscribe form would you like in the footer?',
            admin: {
              layout: 'horizontal',
              width: '50%',
            },
            defaultValue: 'none',
            options: [
              {
                label: 'None',
                value: 'none',
              },
              {
                label: 'Embedded',
                value: 'embedded',
              },
              {
                label: 'Form',
                value: 'form',
              },
            ],
          },
        ],
      },
      {
        name: 'html',
        type: 'textarea',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'embedded',
        },
        label: 'Custom embed form',
        required: true,
      },
      {
        name: 'form',
        type: 'relationship',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'form',
          description: 'Note: We suggest using Message as the Confirmation Type',
        },
        label: 'Choose form',
        relationTo: ['forms'],
        required: true,
        filterOptions: getTenantFilter,
      },
    ],
  },
]

const brandAssetsFields: Field[] = [
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
        Description: '@/collections/Settings/components/USFSLogoDescription#USFSLogoDescription',
      },
    },
  },
]

const socialMediaFields: Field[] = [
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
  },
]

export const Settings: CollectionConfig = {
  slug: 'settings',
  access: accessByTenantRole('settings'),
  labels: {
    singular: 'Website Settings',
    plural: 'Website Settings',
  },
  admin: {
    baseListFilter: filterByTenant,
    group: 'Settings',
  },
  hooks: {
    afterChange: [revalidateSettings],
  },
  fields: [
    tenantField({ unique: true }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: generalFields,
          description:
            'Update your Avalanche Center details. This information is displayed across the website, including in the footer and meta data. Leave any field blank if you do not want it show.',
        },
        {
          label: 'Footer Form',
          fields: footerForm,
          description:
            'Choose which form you would like to display in the footer or embed one. Leave the field blank if you do not want the form to show.',
        },

        {
          label: 'Brand Assets',
          description:
            'Images used throughout the website including in the header, footer, browser tabs, and link previews.',
          fields: brandAssetsFields,
        },
        {
          label: 'Social Media',
          description:
            'Add links to your social media accounts to have the icon appear in the footer. Leave the field blank if you do not want the icon to show.',
          fields: socialMediaFields,
        },
        {
          label: 'Legal Policies',
          description: 'Links to legal policy pages to be displayed in the footer.',
          fields: [
            {
              name: 'terms',
              label: 'Terms of Service',
              type: 'relationship',
              relationTo: 'pages',
              filterOptions: getTenantFilter,
            },
            {
              name: 'privacy',
              label: 'Privacy Policy',
              type: 'relationship',
              relationTo: 'pages',
              filterOptions: getTenantFilter,
            },
          ],
        },
      ],
    },
    contentHashField(),
  ],
}
