import { Field } from 'payload'

export const affinityGroupOptions = [
  { label: 'LGBTQ+', value: 'lgbtq' },
  { label: "Women's Specific", value: 'womens-specific' },
  { label: 'Youth Specific', value: 'youth-specific' },
]

export const affinityGroupField = (): Field => ({
  name: 'affinityGroups',
  type: 'select',
  options: affinityGroupOptions,
  hasMany: true,
  admin: {
    position: 'sidebar',
  },
})
