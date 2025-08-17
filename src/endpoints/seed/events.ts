import type { Tenant } from '@/payload-types'
import type { RequiredDataFromCollectionSlug } from 'payload'

export const seedEventTypes = (tenant: Tenant): RequiredDataFromCollectionSlug<'event-types'>[] => [
  {
    tenant: tenant.id,
    title: 'Avalanche Awareness',
    slug: 'avalanche-awareness',
    description: 'Free introductory courses for the public',
    icon: 'awareness',
    trackAttendance: true,
    generateRevenue: false,
  },
  {
    tenant: tenant.id,
    title: 'Field Course',
    slug: 'field-course',
    description: 'Hands-on field training with avalanche professionals',
    icon: 'course',
    trackAttendance: true,
    generateRevenue: true,
  },
  {
    tenant: tenant.id,
    title: 'Workshop',
    slug: 'workshop',
    description: 'Specialized skills workshops',
    icon: 'workshop',
    trackAttendance: true,
    generateRevenue: true,
  },
  {
    tenant: tenant.id,
    title: 'Fundraising Event',
    slug: 'fundraising-event',
    description: 'Community events to support the center',
    icon: 'fundraiser',
    trackAttendance: false,
    generateRevenue: true,
  },
]

export const seedEventGroups = (
  tenant: Tenant,
): RequiredDataFromCollectionSlug<'event-groups'>[] => [
  {
    tenant: tenant.id,
    title: 'Avalanche Awareness Classes',
    slug: 'avalanche-awareness-classes',
    excerpt: 'Free avalanche classes for the public throughout our forecast area',
    description: {
      root: {
        type: 'root',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                text: 'The Northwest Avalanche Center offers free avalanche classes to the public throughout our forecast area. These classes are a 90 minute introductory presentation geared towards the novice winter backcountry user.',
              },
            ],
          },
        ],
      },
    },
    content: [
      {
        blockType: 'content',
        backgroundColor: 'white',
        columns: [
          {
            richText: {
              root: {
                type: 'root',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [
                      {
                        type: 'text',
                        text: 'These free classes provide an introduction to avalanche awareness and basic winter backcountry safety.',
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    color: '#3B82F6',
    _status: 'published',
  },
  {
    tenant: tenant.id,
    title: 'Field Courses',
    slug: 'field-courses',
    excerpt: 'Hands-on avalanche education in the field with certified instructors',
    description: {
      root: {
        type: 'root',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Our field courses provide comprehensive, hands-on avalanche education in real mountain environments. Led by certified avalanche professionals, these courses combine classroom learning with practical field experience.',
              },
            ],
          },
        ],
      },
    },
    content: [
      {
        blockType: 'content',
        backgroundColor: 'white',
        columns: [
          {
            richText: {
              root: {
                type: 'root',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [
                      {
                        type: 'text',
                        text: 'Multi-day field courses that combine classroom instruction with hands-on mountain experience.',
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    color: '#059669',
    _status: 'published',
  },
  {
    tenant: tenant.id,
    title: 'Community Events',
    slug: 'community-events',
    excerpt: 'Fundraising events, film screenings, and community gatherings',
    description: {
      root: {
        type: 'root',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Join us for community events including fundraising activities, avalanche film screenings, and educational gatherings that bring together the winter backcountry community.',
              },
            ],
          },
        ],
      },
    },
    content: [
      {
        blockType: 'content',
        backgroundColor: 'white',
        columns: [
          {
            richText: {
              root: {
                type: 'root',
                version: 1,
                direction: 'ltr',
                format: '',
                indent: 0,
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [
                      {
                        type: 'text',
                        text: 'Community events that support avalanche education and center operations.',
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    color: '#DC2626',
    _status: 'published',
  },
]

export const seedEvents = (
  tenant: Tenant,
  eventTypes: Record<string, Record<string, any>>,
  eventGroups: Record<string, Record<string, any>>,
  featuredImageId?: number,
): RequiredDataFromCollectionSlug<'events'>[] => {
  const futureDate1 = new Date()
  futureDate1.setDate(futureDate1.getDate() + 14)

  const futureDate2 = new Date()
  futureDate2.setDate(futureDate2.getDate() + 28)

  const futureDate3 = new Date()
  futureDate3.setDate(futureDate3.getDate() + 42)

  return [
    {
      tenant: tenant.id,
      title: 'Level 1 Avalanche Course',
      slug: 'level-1-avalanche-course',
      excerpt: 'Three-day introduction to avalanche safety and decision-making',
      content: {
        root: {
          type: 'root',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'paragraph',
              version: 1,
              children: [
                {
                  type: 'text',
                  text: 'This three-day course provides a comprehensive introduction to avalanche phenomena, terrain assessment, and risk management strategies for recreational backcountry users.',
                },
              ],
            },
          ],
        },
      },
      startDate: futureDate1.toISOString(),
      location: {
        venue: 'NWAC Training Center',
        address: '123 Mountain Way, Seattle, WA 98101',
        isVirtual: false,
      },
      registrationUrl: 'https://example.com/register/level-1',
      capacity: 16,
      cost: 350,
      eventGroups: [eventGroups[tenant.slug]?.['Field Courses']?.id],
      eventType: eventTypes[tenant.slug]?.['Field Course']?.id,
      ...(featuredImageId && { featuredImage: featuredImageId }),
      _status: 'published',
    },
    {
      tenant: tenant.id,
      title: 'Avalanche Awareness Class - Snoqualmie Pass',
      slug: 'avalanche-awareness-snoqualmie',
      excerpt: 'Free 90-minute intro class for backcountry beginners',
      content: {
        root: {
          type: 'root',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'paragraph',
              version: 1,
              children: [
                {
                  type: 'text',
                  text: 'A free introductory class covering basic avalanche awareness, terrain recognition, and decision-making for those new to winter backcountry travel.',
                },
              ],
            },
          ],
        },
      },
      startDate: futureDate2.toISOString(),
      location: {
        venue: 'Snoqualmie Pass Visitor Center',
        address: 'Snoqualmie Pass, WA',
        isVirtual: false,
      },
      registrationUrl: 'https://example.com/register/awareness-snoqualmie',
      capacity: 30,
      cost: 0,
      eventGroups: [eventGroups[tenant.slug]?.['Avalanche Awareness Classes']?.id],
      eventType: eventTypes[tenant.slug]?.['Avalanche Awareness']?.id,
      _status: 'published',
    },
    {
      tenant: tenant.id,
      title: 'Weather & Forecasting Workshop',
      slug: 'weather-forecasting-workshop',
      excerpt: 'Deep dive into weather patterns and avalanche forecasting challenges',
      content: {
        root: {
          type: 'root',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'paragraph',
              version: 1,
              children: [
                {
                  type: 'text',
                  text: 'An advanced workshop exploring weather patterns, snowpack evolution, and the challenges faced by avalanche forecasters in the Pacific Northwest.',
                },
              ],
            },
          ],
        },
      },
      startDate: futureDate3.toISOString(),
      location: {
        isVirtual: true,
        virtualUrl: 'https://zoom.us/j/example',
      },
      registrationUrl: 'https://example.com/register/weather-workshop',
      capacity: 50,
      cost: 25,
      eventGroups: [eventGroups[tenant.slug]?.['Community Events']?.id],
      eventType: eventTypes[tenant.slug]?.['Workshop']?.id,
      _status: 'published',
    },
  ]
}
