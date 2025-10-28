export type EventType = {
  label: string
  description?: string | null
  crmId?: string | null
  crmIntegration?: ('ac-salesforce' | 'a3-crm') | null
  value: string
}
export const eventTypesData: EventType[] = [
  {
    label: 'Events By AC',
    description:
      'General events organized and hosted by the Avalanche Center, including community events, meetings, and social gatherings.',
    value: 'events-by-ac',
    crmId: 'events_by_ac',
    crmIntegration: 'ac-salesforce',
  },
  {
    label: 'Awareness',
    description:
      'Free avalanche awareness presentations designed for beginners. These events introduce basic avalanche safety concepts and are open to all.',
    value: 'awareness',
    crmId: 'awareness',
    crmIntegration: 'ac-salesforce',
  },
  {
    label: 'Workshop',
    description:
      'Specialized workshops covering specific avalanche safety topics, techniques, or skills. May require previous knowledge or experience.',
    value: 'workshop',
    crmId: 'workshop',
    crmIntegration: 'ac-salesforce',
  },
  {
    label: 'Field Class by AC',
    description:
      'Hands-on field-based avalanche education classes taught by Avalanche Center staff in real mountain environments.',
    value: 'field-class-by-ac',
    crmId: 'field_class_by_ac',
    crmIntegration: 'ac-salesforce',
  },
  {
    label: 'Course by External Provider',
    description:
      'Avalanche education courses offered by A3-accredited external providers. These courses follow standardized curricula and are listed nationally.',
    value: 'course-by-external-provider',
    crmId: 'course_by_external_provider',
    crmIntegration: 'a3-crm',
  },
  {
    label: 'Volunteer',
    description:
      'Volunteer opportunities with the Avalanche Center, including observation data collection, education assistance, and event support.',
    value: 'volunteer',
    crmId: 'volunteer',
    crmIntegration: 'ac-salesforce',
  },
]
