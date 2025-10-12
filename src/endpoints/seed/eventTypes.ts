import { RequiredDataFromCollectionSlug } from 'payload'

export const eventTypesData: RequiredDataFromCollectionSlug<'eventTypes'>[] = [
  {
    title: 'Events By AC',
    description:
      'General events organized and hosted by the Avalanche Center, including community events, meetings, and social gatherings.',
    slug: 'events-by-ac',
    crmId: 'events_by_ac',
    crmIntegration: 'ac-salesforce',
  },
  {
    title: 'Awareness',
    description:
      'Free avalanche awareness presentations designed for beginners. These events introduce basic avalanche safety concepts and are open to all.',
    slug: 'awareness',
    crmId: 'awareness',
    crmIntegration: 'ac-salesforce',
  },
  {
    title: 'Workshop',
    description:
      'Specialized workshops covering specific avalanche safety topics, techniques, or skills. May require previous knowledge or experience.',
    slug: 'workshop',
    crmId: 'workshop',
    crmIntegration: 'ac-salesforce',
  },
  {
    title: 'Field Class by AC',
    description:
      'Hands-on field-based avalanche education classes taught by Avalanche Center staff in real mountain environments.',
    slug: 'field-class-by-ac',
    crmId: 'field_class_by_ac',
    crmIntegration: 'ac-salesforce',
  },
  {
    title: 'Course by External Provider',
    description:
      'Avalanche education courses offered by A3-accredited external providers. These courses follow standardized curricula and are listed nationally.',
    slug: 'course-by-external-provider',
    crmId: 'course_by_external_provider',
    crmIntegration: 'a3-crm',
  },
  {
    title: 'Volunteer',
    description:
      'Volunteer opportunities with the Avalanche Center, including observation data collection, education assistance, and event support.',
    slug: 'volunteer',
    crmId: 'volunteer',
    crmIntegration: 'ac-salesforce',
  },
]
