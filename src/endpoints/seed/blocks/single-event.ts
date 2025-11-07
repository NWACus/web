import type { SingleEventBlock } from '@/payload-types'

export const singleEventBlock: SingleEventBlock = {
  blockType: 'singleEvent',
  backgroundColor: 'transparent',
  event: 0, // Will be populated with actual event reference during seeding
}
