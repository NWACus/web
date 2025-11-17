import type { Event, Media, Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const homePage: (
  tenant: Tenant,
  heroImage: Media,
  events: Event[],
) => RequiredDataFromCollectionSlug<'homePages'> = (
  tenant: Tenant,
  heroImage: Media,
  events: Event[],
): RequiredDataFromCollectionSlug<'homePages'> => {
  return {
    tenant: tenant.id,
    quickLinks: [],
    highlightedContent: {
      enabled: true,
      heading: 'Welcome to ' + tenant.name,
      backgroundColor: 'brand-700',
      columns: [
        {
          richText: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: 'Stay informed with the latest avalanche forecasts, mountain weather conditions, and safety information for our region.',
                      type: 'text',
                      style: '',
                      detail: 0,
                      format: 0,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  textStyle: '',
                  textFormat: 0,
                },
              ],
              direction: 'ltr',
            },
          },
        },
        {
          richText: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: 'Our mission is to increase avalanche awareness, reduce avalanche impacts, and equip the community with essential safety education and data.',
                      type: 'text',
                      style: '',
                      detail: 0,
                      format: 0,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  textStyle: '',
                  textFormat: 0,
                },
              ],
              direction: 'ltr',
            },
          },
        },
      ],
    },
    layout: [
      {
        backgroundColor: 'brand-200',
        layout: '1_1',
        columns: [
          {
            richText: {
              root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'heading',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        mode: 'normal',
                        text: 'Avalanche Safety Information',
                        type: 'text',
                        style: '',
                        detail: 0,
                        format: 0,
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    tag: 'h2',
                    textStyle: '',
                    textFormat: 0,
                  },
                  {
                    type: 'paragraph',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        mode: 'normal',
                        text: 'Access current avalanche forecasts, weather data, and safety resources to make informed decisions in the backcountry. Our team of professional forecasters provides detailed analysis of snow and weather conditions throughout our forecast area.',
                        type: 'text',
                        style: '',
                        detail: 0,
                        format: 0,
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    textStyle: '',
                    textFormat: 0,
                  },
                ],
                direction: 'ltr',
              },
            },
          },
        ],
        blockType: 'content',
      },
      {
        media: heroImage.id,
        blockType: 'mediaBlock',
        backgroundColor: 'transparent',
        alignContent: 'center',
        imageSize: 'large',
      },
      {
        blockType: 'eventList',
        heading: 'Upcoming Events',
        backgroundColor: 'transparent',
        eventOptions: 'dynamic',
        dynamicOptions: {
          maxEvents: 4,
          queriedEvents: events.slice(0, 4).map((event) => event.id), // Use first 4 events for preview
        },
      },
    ],
    publishedAt: new Date().toISOString(),
  }
}
