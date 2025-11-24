import { Field } from 'payload'

export const affinityGroupOptions = [
  { label: 'LGBTQ+', value: 'lgbtq' },
  { label: 'Women', value: 'women' },
  { label: 'Youth', value: 'youth' },
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
