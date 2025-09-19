import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const imageLinkGrid = (image: Media): RequiredDataFromCollectionSlug<'pages'>['layout'] => {
  return [
    // 4 image layout
    {
      blockName: null,
      columns: [
        {
          image: image.id,
          caption: 'This is Dawn',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
        {
          image: image.id,
          caption: 'This is Brooke',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
        {
          image: image.id,
          caption: 'this is scott',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },

        {
          image: image.id,
          caption: 'this is louise',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
      ],
      blockType: 'imageLinkGrid',
    },
    // 3 image layout
    {
      blockName: null,
      columns: [
        {
          image: image.id,
          caption: 'This is Dawn',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
        {
          image: image.id,
          caption: 'This is Brooke',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
        {
          image: image.id,
          caption: 'this is scott',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
      ],
      blockType: 'imageLinkGrid',
    },
    // 2 image layout
    {
      blockName: null,
      columns: [
        {
          image: image.id,
          caption: 'This is Dawn',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
        {
          image: image.id,
          caption: 'This is Brooke',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
      ],
      blockType: 'imageLinkGrid',
    },
    // 1 image layout
    {
      blockName: null,
      columns: [
        {
          image: image.id,
          caption: 'This is Dawn',
          link: {
            type: 'external',
            newTab: null,
            url: 'https://nwac.us',
          },
        },
      ],
      blockType: 'imageLinkGrid',
    },
  ]
}
