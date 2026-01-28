import colorPickerField from '@/fields/color'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { Block, RadioFieldValidation } from 'payload'
import { radio } from 'payload/shared'

const validateSponsorsLayout: RadioFieldValidation = async (val, args) => {
  const { req, siblingData } = args
  if (
    val === 'banner' &&
    siblingData &&
    typeof siblingData === 'object' &&
    'sponsors' in siblingData
  ) {
    const sponsorIds = siblingData.sponsors
    const sponsors = await req.payload
      .find({
        collection: 'sponsors',
        where: {
          id: {
            in: sponsorIds,
          },
        },
        select: {
          id: true,
          photo: true,
        },
      })
      .then((res) => res.docs)

    if (sponsors.length === 1) {
      const validSponsor = sponsors[0]
      if (
        validSponsor.photo &&
        typeof validSponsor.photo === 'object' &&
        validSponsor.photo.width &&
        validSponsor.photo.height
      ) {
        const ratio = validSponsor.photo.width / validSponsor.photo.height
        const minWidthRatio = 6

        if (ratio >= minWidthRatio) {
          return radio(val, args)
        } else {
          return 'Sponsor photo ratio is incorrect. Ideal size 1280x200'
        }
      }
    } else {
      return 'Only one sponsor with photo must be selected'
    }
  }
  return radio(val, args)
}

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
            '@/blocks/Sponsors/components/SponsorsLayoutDescription#SponsorsLayoutDescription',
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
      validate: validateSponsorsLayout,
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
  ],
}
