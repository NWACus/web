import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { Block } from 'payload'

export const SponsorsBlock: Block = {
  slug: 'sponsorsBlock',
  interfaceName: 'SponsorsBlock',
  imageURL: '/thumbnail/SponsorsThumbnail.jpg',
  fields: [
    colorPickerField('Background color'),
    {
      type: 'radio',
      name: 'sponsorsLayout',
      label: 'Choose a layout for the sponsors logos',
      defaultValue: 'static',
      required: true,
      admin: {
        components: {
          Description:
            '@/blocks/SponsorsBlock/components/SponsorsLayoutDescription#SponsorsLayoutDescription',
        },
      },
      options: [
        {
          label: 'Static',
          value: 'static',
        },
        {
          label: 'Carousel',
          value: 'carousel',
        },
        {
          label: 'Banner',
          value: 'banner',
        },
      ],
    },
    {
      name: 'sponsors',
      type: 'relationship',
      relationTo: 'sponsors',
      label: 'Choose a sponsor',
      hasMany: true,
      required: true,
      filterOptions: getTenantFilter,
    },
    {
      name: 'wrapInContainer',
      admin: {
        description:
          'Checking this will render the block with additional padding around it and using the background color you have selected.',
      },
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
