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
  eventType: string
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

interface QuickDateFilter {
  id: string
  label: string
  startDate: () => string // Returns ISO date string
  endDate: () => string | null // Returns ISO date string or null for "no end"
  sortDirection: 'asc' | 'desc' // How events should be sorted for this filter
}

export const QUICK_DATE_FILTERS: QuickDateFilter[] = [
  {
    id: 'upcoming',
    label: 'Upcoming',
    startDate: () => new Date().toISOString().split('T')[0], // Today
    endDate: () => null,
    sortDirection: 'asc', // Soonest events first
  },
  {
    id: 'this-week',
    label: 'This Week',
    startDate: () => {
      const today = new Date()
      return today.toISOString().split('T')[0]
    },
    endDate: () => {
      const today = new Date()
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (6 - today.getDay())) // Next Saturday
      return endOfWeek.toISOString().split('T')[0]
    },
    sortDirection: 'asc', // Soonest events first
  },
  {
    id: 'next-week',
    label: 'Next Week',
    startDate: () => {
      const today = new Date()
      const nextSunday = new Date(today)
      nextSunday.setDate(today.getDate() + (7 - today.getDay())) // Next Sunday
      return nextSunday.toISOString().split('T')[0]
    },
    endDate: () => {
      const today = new Date()
      const nextSaturday = new Date(today)
      nextSaturday.setDate(today.getDate() + (7 - today.getDay()) + 6) // Next Saturday
      return nextSaturday.toISOString().split('T')[0]
    },
    sortDirection: 'asc', // Soonest events first
  },
  {
    id: 'this-month',
    label: 'This Month',
    startDate: () => {
      const today = new Date()
      return today.toISOString().split('T')[0]
    },
    endDate: () => {
      const today = new Date()
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return lastDayOfMonth.toISOString().split('T')[0]
    },
    sortDirection: 'asc', // Soonest events first
  },
  {
    id: 'next-month',
    label: 'Next Month',
    startDate: () => {
      const today = new Date()
      const firstDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      return firstDayNextMonth.toISOString().split('T')[0]
    },
    endDate: () => {
      const today = new Date()
      const lastDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      return lastDayNextMonth.toISOString().split('T')[0]
    },
    sortDirection: 'asc', // Soonest events first
  },
  {
    id: 'past-events',
    label: 'Past Events',
    startDate: () => {
      // Start from 1 year ago
      const today = new Date()
      const oneYearAgo = new Date(today)
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      return oneYearAgo.toISOString().split('T')[0]
    },
    endDate: () => {
      // End at yesterday
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      return yesterday.toISOString().split('T')[0]
    },
    sortDirection: 'desc', // Most recent events first
  },
]
