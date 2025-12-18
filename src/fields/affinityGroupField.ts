import { Field } from 'payload'

export const affinityGroupOptions = [
  { label: 'For LGBTQ+', value: 'lgbtq' },
  { label: 'For Women', value: 'women' },
  { label: 'For Youth', value: 'youth' },
]

export const affinityGroupField = (): Field => ({
  name: 'affinityGroups',
  label: 'Interest Groups',
  type: 'select',
  options: affinityGroupOptions,
  hasMany: true,
  admin: {
    position: 'sidebar',
  },
})
