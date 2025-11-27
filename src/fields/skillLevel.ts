import { Field } from 'payload'

export const skillLevelOptions = [
  { label: '0 - Beginner Friendly', value: 'beginner' },
  { label: '1 - Prerequisites Required', value: 'pre-req' },
  { label: '2 - Professional Level', value: 'professional' },
]

export const skillLevelField = (): Field => ({
  name: 'skillLevel',
  type: 'select',
  options: skillLevelOptions,
  admin: {
    description: 'Skill level required for this event',
  },
})
