import { buttonField } from '@/fields/button'
import type { Block } from 'payload'

export const ButtonBlock: Block = {
  slug: 'buttonBlock',
  interfaceName: 'ButtonBlock',
  fields: [buttonField(['default', 'secondary', 'ghost', 'outline'])],
}
