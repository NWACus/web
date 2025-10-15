import type { EventListBlock } from '@/payload-types'

export const eventListBlock: EventListBlock = {
  blockType: 'eventList',
  heading: 'Upcoming Events',
  backgroundColor: 'transparent',
  belowHeadingContent: {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Join us for upcoming avalanche education courses, field trips, and community events.',
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
    },
  },
  eventOptions: 'dynamic',
  dynamicOptions: {
    sortBy: 'startDate',
    showUpcomingOnly: true,
    maxEvents: 4,
    queriedEvents: [], // Will be populated during seeding
  },
  staticOptions: {
    staticEvents: [], // Will be populated with actual event references during seeding
  },
}
