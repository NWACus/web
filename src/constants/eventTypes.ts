export type EventType = {
  label: string
  value:
    | 'events-by-ac'
    | 'awareness'
    | 'workshop'
    | 'field-class-by-ac'
    | 'volunteer'
    | 'events-by-others'
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
    label: 'Volunteer',
    description:
      'Volunteer opportunities with the Avalanche Center, including observation data collection, education assistance, and event support.',
    value: 'volunteer',
  },
  {
    label: 'Events by Others',
    description: 'Events hosted by third-party organizations.',
    value: 'events-by-others',
  },
]
