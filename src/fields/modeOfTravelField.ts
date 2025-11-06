import { Field } from 'payload'

export const modeOfTravelField = (): Field => ({
  name: 'modeOfTravel',
  type: 'select',
  options: [
    { label: 'Ski', value: 'ski' },
    { label: 'Splitboard', value: 'splitboard' },
    { label: 'Motorized', value: 'motorized' },
    { label: 'Snowshoe', value: 'snowshoe' },
  ],
  hasMany: true,
  admin: {
    position: 'sidebar',
  },
})
