import { Field } from 'payload'

export const skillLevelOptions = [
  { label: 'Beginner Friendly', value: 'beginner' },
  { label: 'Prerequisites Required', value: 'pre-req' },
  { label: 'Professional Level', value: 'professional' },
]

export const skillLevelField = (): Field => ({
  name: 'skillLevel',
  type: 'select',
  options: skillLevelOptions,
  admin: {
    description: 'Skill level required for this event',
  },
})
