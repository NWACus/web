import { Field } from 'payload'

export const affinityGroupOptions = [
  { label: 'LGBTQ+', value: 'lgbtq' },
  { label: 'Female Identifying', value: 'women' },
  { label: 'Youth', value: 'youth' },
  { label: 'Hut based', value: 'hut-based' },
  { label: 'Ski mountaineering', value: 'ski-mountaineering' },
  { label: 'Spanish Language', value: 'spanish-language' },
  { label: 'BIPOC', value: 'bipoc' },
  { label: 'Hybrid', value: 'hybrid' },
  {
    label: 'National Avalanche School Field Session',
    value: 'national-avalanche-school-field-session',
  },
]

export const affinityGroupField = (): Field => ({
  name: 'affinityGroups',
  label: 'Specialty',
  type: 'select',
  options: affinityGroupOptions,
  hasMany: true,
  admin: {
    position: 'sidebar',
  },
})
