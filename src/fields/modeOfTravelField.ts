import { Field } from 'payload'

export const modeOfTravelOptions = [
  { label: 'Ski', value: 'ski' },
  { label: 'Splitboard', value: 'splitboard' },
  { label: 'Motorized', value: 'motorized' },
  { label: 'Snowshoe', value: 'snowshoe' },
]

export const modeOfTravelField = (): Field => ({
  name: 'modeOfTravel',
  type: 'select',
  options: modeOfTravelOptions,
  hasMany: true,
  admin: {
    position: 'sidebar',
  },
})
