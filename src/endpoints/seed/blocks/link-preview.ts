import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const linkPreview = (image: Media): RequiredDataFromCollectionSlug<'pages'>['layout'] => {
  return [
    // 3 cards
    {
      backgroundColor: 'transparent',
      blockName: '3 cards',
      cards: [
        {
          image: image.id,
          title: 'Snowmobile!',
          text: 'Brooklyn fanny pack la croix gastropub normcore chia. Skateboard raw denim mixtape blog. Unicorn wayfarers pabst brunch retro DIY semiotics jianbing jean shorts blog ascot plaid beard.',
          button: {
            type: 'custom',
            newTab: true,
            url: 'www.google.com',
            label: 'Click me',
            appearance: 'default',
          },
        },

        {
          image: image.id,
          title: 'Blue book',
          text: 'Brooklyn fanny pack la croix gastropub normcore chia. Skateboard raw denim mixtape blog. Unicorn wayfarers pabst brunch retro DIY semiotics jianbing jean shorts blog ascot plaid beard.',
          button: {
            type: 'custom',
            appearance: 'default',
            label: 'Click here',
            url: '/',
          },
        },

        {
          image: image.id,
          title: 'Snowmobile!',
          text: 'Brooklyn fanny pack la croix gastropub normcore chia. Skateboard raw denim mixtape blog. Unicorn wayfarers pabst brunch retro DIY semiotics jianbing jean shorts blog ascot plaid beard.',

          button: {
            type: 'custom',
            appearance: 'default',
            label: 'Click here',
            url: '/',
          },
        },
      ],
      blockType: 'linkPreview',
    },
    // 2 column layout
    {
      blockName: '2 cards',
      backgroundColor: 'brand-500',
      cards: [
        {
          image: image.id,
          title: 'Big image',
          text: 'Brooklyn fanny pack la croix gastropub normcore chia. Skateboard raw denim mixtape blog. Unicorn wayfarers pabst brunch retro DIY semiotics jianbing jean shorts blog ascot plaid beard.',

          button: {
            type: 'custom',
            appearance: 'default',
            label: 'Click here',
            url: '/',
          },
        },

        {
          image: image.id,
          title: 'Small image',
          text: 'Brooklyn fanny pack la croix gastropub normcore chia. Skateboard raw denim mixtape blog. Unicorn wayfarers pabst brunch retro DIY semiotics jianbing jean shorts blog ascot plaid beard.',
          button: {
            type: 'custom',
            appearance: 'default',
            label: 'Click here',
            url: '/',
          },
        },
      ],
      blockType: 'linkPreview',
    },
  ]
}
