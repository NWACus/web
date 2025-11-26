import { Field } from 'payload'

export const skillLevelOptions = [
  { label: '0 - Beginner Friendly', value: '0' },
  { label: '1 - Prerequisites Required', value: '1' },
  { label: '2 - Professional Level', value: '2' },
]

export const skillLevelField = (): Field => ({
  name: 'skillLevel',
  type: 'select',
  options: skillLevelOptions,
  admin: {
    description: 'Skill level required for this event',
  },
})
