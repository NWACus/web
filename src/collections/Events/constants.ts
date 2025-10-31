export type EventType = {
  label: string
  value: string
  description?: string | null
}

export const eventTypesData: EventType[] = [
  {
    label: 'Events By AC',
    description:
      'General events organized and hosted by the Avalanche Center, including community events, meetings, and social gatherings.',
    value: 'events-by-ac',
  },
  {
    label: 'Awareness',
    description:
      'Free avalanche awareness presentations designed for beginners. These events introduce basic avalanche safety concepts and are open to all.',
    value: 'awareness',
  },
  {
    label: 'Workshop',
    description:
      'Specialized workshops covering specific avalanche safety topics, techniques, or skills. May require previous knowledge or experience.',
    value: 'workshop',
  },
  {
    label: 'Field Class by AC',
    description:
      'Hands-on field-based avalanche education classes taught by Avalanche Center staff in real mountain environments.',
    value: 'field-class-by-ac',
  },
  {
    label: 'Course by External Provider',
    description:
      'Avalanche education courses offered by A3-accredited external providers. These courses follow standardized curricula and are listed nationally.',
    value: 'course-by-external-provider',
  },
  {
    label: 'Volunteer',
    description:
      'Volunteer opportunities with the Avalanche Center, including observation data collection, education assistance, and event support.',
    value: 'volunteer',
  },
]

export type EventSubType = {
  label: string
  value: string
  description?: string | null
  eventType: 'course-by-external-provider' // this type could be expanded to include other eventTypes in the future
}
export const eventSubTypesData: EventSubType[] = [
  // Sub-types for Course by External Provider (A3 courses)
  {
    label: 'Rec 1',
    description:
      'Recreational Level 1: Introduction to avalanche safety for recreational backcountry travelers. Covers avalanche basics, rescue, and decision-making.',
    eventType: 'course-by-external-provider',
    value: 'rec-1',
  },
  {
    label: 'Rec 2',
    description:
      'Recreational Level 2: Advanced avalanche course building on Rec 1. Emphasizes weather, snowpack analysis, and complex terrain travel.',
    eventType: 'course-by-external-provider',
    value: 'rec-2',
  },
  {
    label: 'Pro 1',
    description:
      'Professional Level 1: Entry-level professional avalanche training for ski patrollers, guides, and others working in avalanche terrain.',
    eventType: 'course-by-external-provider',
    value: 'pro-1',
  },
  {
    label: 'Pro 2',
    description:
      'Professional Level 2: Advanced professional avalanche course covering forecasting, explosives, and avalanche program management.',
    eventType: 'course-by-external-provider',
    value: 'pro-2',
  },
  {
    label: 'Rescue',
    description:
      'Avalanche rescue courses focusing on companion rescue, search techniques, and emergency response in avalanche terrain.',
    eventType: 'course-by-external-provider',
    value: 'rescue',
  },
  {
    label: 'Awareness',
    description:
      'Introductory avalanche awareness sessions offered by external providers, covering basic avalanche safety concepts.',
    eventType: 'course-by-external-provider',
    value: 'awareness-external',
  },
]
