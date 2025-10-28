export type EventSubType = {
  label: string
  description?: string | null
  eventType: string
  crmId?: string | null
  crmIntegration?: ('ac-salesforce' | 'a3-crm') | null
  value: string
}
export const eventSubTypesData: EventSubType[] = [
  // Sub-types for Field Class by AC
  {
    label: 'Snowmobile Classes',
    description:
      'Avalanche safety and rescue training specifically designed for snowmobile users and backcountry riders.',
    eventType: 'field-class-by-ac',
    value: 'snowmobile-classes',
    crmId: 'snowmobile_classes',
    crmIntegration: 'ac-salesforce',
  },

  // Sub-types for Course by External Provider (A3 courses)
  {
    label: 'Rec 1',
    description:
      'Recreational Level 1: Introduction to avalanche safety for recreational backcountry travelers. Covers avalanche basics, rescue, and decision-making.',
    eventType: 'course-by-external-provider',
    value: 'rec-1',
    crmId: 'rec_1',
    crmIntegration: 'a3-crm',
  },
  {
    label: 'Rec 2',
    description:
      'Recreational Level 2: Advanced avalanche course building on Rec 1. Emphasizes weather, snowpack analysis, and complex terrain travel.',
    eventType: 'course-by-external-provider',
    value: 'rec-2',
    crmId: 'rec_2',
    crmIntegration: 'a3-crm',
  },
  {
    label: 'Pro 1',
    description:
      'Professional Level 1: Entry-level professional avalanche training for ski patrollers, guides, and others working in avalanche terrain.',
    eventType: 'course-by-external-provider',
    value: 'pro-1',
    crmId: 'pro_1',
    crmIntegration: 'a3-crm',
  },
  {
    label: 'Pro 2',
    description:
      'Professional Level 2: Advanced professional avalanche course covering forecasting, explosives, and avalanche program management.',
    eventType: 'course-by-external-provider',
    value: 'pro-2',
    crmId: 'pro_2',
    crmIntegration: 'a3-crm',
  },
  {
    label: 'Rescue',
    description:
      'Avalanche rescue courses focusing on companion rescue, search techniques, and emergency response in avalanche terrain.',
    eventType: 'course-by-external-provider',
    value: 'rescue',
    crmId: 'rescue',
    crmIntegration: 'a3-crm',
  },
  {
    label: 'Awareness',
    description:
      'Introductory avalanche awareness sessions offered by external providers, covering basic avalanche safety concepts.',
    eventType: 'course-by-external-provider',
    value: 'awareness-external',
    crmId: 'awareness_external',
    crmIntegration: 'a3-crm',
  },
]
