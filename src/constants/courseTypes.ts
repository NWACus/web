export type CourseType = {
  label: string
  value: string
  description?: string | null
}

export const courseTypesData: CourseType[] = [
  {
    label: 'Rec 1',
    description:
      'Recreational Level 1: Introduction to avalanche safety for recreational backcountry travelers. Covers avalanche basics, rescue, and decision-making.',
    value: 'rec-1',
  },
  {
    label: 'Rec 2',
    description:
      'Recreational Level 2: Advanced avalanche course building on Rec 1. Emphasizes weather, snowpack analysis, and complex terrain travel.',
    value: 'rec-2',
  },
  {
    label: 'Pro 1',
    description:
      'Professional Level 1: Entry-level professional avalanche training for ski patrollers, guides, and others working in avalanche terrain.',
    value: 'pro-1',
  },
  {
    label: 'Pro 2',
    description:
      'Professional Level 2: Advanced professional avalanche course covering forecasting, explosives, and avalanche program management.',
    value: 'pro-2',
  },
  {
    label: 'Rescue',
    description:
      'Avalanche rescue courses focusing on companion rescue, search techniques, and emergency response in avalanche terrain.',
    value: 'rescue',
  },
  {
    label: 'Awareness',
    description:
      'Introductory avalanche awareness sessions offered by external providers, covering basic avalanche safety concepts.',
    value: 'awareness-external',
  },
]
