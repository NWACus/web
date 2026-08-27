import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { validatePhone } from '@/utilities/validatePhone'
import { CollectionConfig, Field, TextFieldValidation } from 'payload'
import { text } from 'payload/shared'
import { revalidateSettings } from './hooks/revalidateSettings'

const validateHashtag: TextFieldValidation = (value, args) => {
  return value
    ? /^#[A-Za-z0-9_](?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}[A-Za-z0-9_]$/.test(value) ||
        `${value} is not a valid hashtag`
    : text(value, args)
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
    validate: validatePhone,
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
    validate: validatePhone,
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
      description:
        'Recommended: Use square (1:1) aspect ratio images for optimal display. Images with aspect ratios close to square are also acceptable.',
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
        'Used as the browser tab icon. Recommended: Use a compressed, 96x96 pixel, square aspect ratio image.',
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
      description: 'Used in the header of your website next to the USFS logo if added.',
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

const featuresFields: Field[] = [
  {
    name: 'nativeProducts',
    label: 'Native Products',
    type: 'group',
    access: {
      // Feature flags default off and are flipped deliberately per tenant by a
      // super admin; center admins can see but not toggle them.
      create: hasSuperAdminPermissions,
      update: hasSuperAdminPermissions,
    },
    fields: [
      {
        name: 'mwf',
        label: 'Mountain Weather Forecast',
        type: 'checkbox',
        defaultValue: false,
        admin: {
          description:
            'Enables native Mountain Weather Forecast authoring and the public MWF page for this center. While off, no MWF surface appears anywhere in the admin or on the public site.',
        },
      },
    ],
  },
]

const mwfFields: Field[] = [
  {
    name: 'mwf',
    label: '', // leaving blank intentionally since this is a single-group tab (group wanted for API response organization)
    type: 'group',
    fields: [
      {
        name: 'zones',
        type: 'array',
        labels: { singular: 'Zone', plural: 'Zones' },
        admin: {
          description:
            'The forecast zones the MWF publishes for. Row order is display order in the editor and on the public page.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'code',
                type: 'text',
                required: true,
                admin: { width: '25%', description: 'Short unique code, e.g. olympics' },
              },
              {
                name: 'name',
                type: 'text',
                required: true,
                admin: { width: '50%', description: 'Display name, e.g. Olympics' },
              },
              {
                name: 'airfireZoneId',
                type: 'text',
                admin: {
                  width: '25%',
                  description:
                    'Airfire zone id used to fetch temperature and wind model guidance for this zone',
                },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'nacZoneIds',
                type: 'text',
                admin: {
                  description:
                    'NAC forecast-zone id(s) this MWF zone serves in the legacy app API, comma-separated (e.g. 1645)',
                },
              },
            ],
          },
        ],
      },
      {
        name: 'points',
        type: 'array',
        labels: { singular: 'Forecast Point', plural: 'Forecast Points' },
        admin: {
          description:
            'The named locations precipitation is forecast for. Row order is display order in the precipitation grid.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'code',
                type: 'text',
                required: true,
                admin: { width: '25%', description: 'Short unique code, e.g. hurricane-ridge' },
              },
              {
                name: 'name',
                type: 'text',
                required: true,
                admin: { width: '50%', description: 'Display name, e.g. Hurricane Ridge' },
              },
              {
                name: 'zoneCode',
                type: 'text',
                required: true,
                admin: { width: '25%', description: 'Code of the zone this point belongs to' },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'latitude',
                type: 'number',
                required: true,
                min: -90,
                max: 90,
                admin: { width: '50%' },
              },
              {
                name: 'longitude',
                type: 'number',
                required: true,
                min: -180,
                max: 180,
                admin: { width: '50%' },
              },
            ],
          },
        ],
      },
      {
        name: 'extendedSnowLevelZones',
        type: 'array',
        labels: { singular: 'Extended Snow Level Zone', plural: 'Extended Snow Level Zones' },
        admin: {
          description:
            'The subset of zones that get the extended snow-level outlook on afternoon issuances',
        },
        fields: [
          {
            name: 'zoneCode',
            type: 'text',
            required: true,
            admin: { description: 'Code of a zone configured above' },
          },
        ],
      },
      {
        name: 'models',
        type: 'array',
        labels: { singular: 'Model Source', plural: 'Model Sources' },
        admin: {
          description:
            'Weather model sources rendered as click-to-fill guidance columns beside entry cells in the editor',
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'name',
                type: 'text',
                required: true,
                admin: {
                  width: '50%',
                  description: 'Label shown in the guidance column header, e.g. WRF',
                },
              },
              {
                name: 'sourceType',
                type: 'select',
                required: true,
                defaultValue: 'point-json',
                options: [
                  { label: 'Point JSON', value: 'point-json' },
                  { label: 'Zone summary JSON', value: 'zone-summary-json' },
                  { label: 'GRIB2 (byte-range .idx)', value: 'grib2' },
                ],
                admin: { width: '35%' },
              },
              {
                name: 'active',
                type: 'checkbox',
                defaultValue: true,
                admin: {
                  width: '15%',
                  description: 'Inactive models are not fetched and show no column',
                },
              },
            ],
          },
          {
            name: 'url',
            type: 'text',
            required: true,
            admin: {
              description:
                'Source URL. Point JSON sources may include a {point} placeholder substituted with the forecast point code.',
            },
          },
          {
            name: 'config',
            type: 'json',
            admin: {
              description:
                'Source-specific configuration such as field naming and forecast-hour offsets',
            },
          },
        ],
      },
    ],
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
          label: 'Features',
          description:
            'Per-center feature flags. These are managed by super admins and default off.',
          fields: featuresFields,
        },
        {
          label: 'Mountain Weather',
          description:
            'Content configuration for the native Mountain Weather Forecast: zones, forecast points, extended snow-level zones, and model guidance sources.',
          admin: {
            condition: (data) => Boolean(data?.nativeProducts?.mwf),
          },
          fields: mwfFields,
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
